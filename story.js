import * as THREE from 'three';
import { setMessy, spawnBags } from './world.js';
import * as audio from './audio.js';

const DAY_LOOP = [
  { id: 'kitchenTable', verb: 'eat', objective: 'Πήγαινε στην κουζίνα για πρωινό.' },
  { id: 'frontDoor', verb: 'exit', objective: 'Βγες από το σπίτι.', afterFade: '3 ώρες αργότερα' },
  { id: 'frontDoor', verb: 'enter', objective: 'Μπες μέσα στο σπίτι.' },
  { id: 'kitchenTable', verb: 'eat', objective: 'Πήγαινε να φας μεσημεριανό.', afterLunchHook: true },
  { id: 'bed', verb: 'nap', objective: 'Πήγαινε για ύπνο για λίγο.', quickFade: true },
  { id: 'kitchenTable', verb: 'eat', objective: 'Πήγαινε να φας απογευματινό.' },
  { id: 'frontDoor', verb: 'exit', objective: 'Βγες από το σπίτι.', afterFade: '2 ώρες αργότερα' },
  { id: 'frontDoor', verb: 'enter', objective: 'Μπες μέσα στο σπίτι.' },
  { id: 'kitchenTable', verb: 'eat', objective: 'Πήγαινε να φας βραδινό.' }
];

export class Story {
  constructor(game) {
    this.game = game;
    this.currentTargetId = null;
    this._interactResolve = null;
    this._interactGuard = null;
    this._eResolve = null;

    this.ended = false;
    this.watchForBedroomEntry = false;
    this.staringDone = false;
  }

  onKeyE() {
    if (this.ended) return;
    if (this._eResolve) {
      const r = this._eResolve;
      this._eResolve = null;
      r();
      return;
    }
    if (this.currentTargetId) {
      const inRange = this.game.player.nearestInteractable(this.game.world.interactables, this.currentTargetId);
      if (inRange && this._interactResolve) {
        if (this._interactGuard && !this._interactGuard()) return;
        const resolve = this._interactResolve;
        this.currentTargetId = null;
        this._interactResolve = null;
        this._interactGuard = null;
        resolve();
      }
    }
  }

  promptFor(id, verb) {
    const labels = {
      frontDoor: { open: 'Άνοιξε την πόρτα', exit: 'Βγες από το σπίτι', enter: 'Μπες μέσα' },
      bed: { sleep: 'Πήγαινε για ύπνο', nap: 'Ξάπλωσε για λίγο' },
      kitchenTable: { eat: 'Φάε' },
      couch: { watch: 'Κάθισε να δεις τηλεόραση' },
      visitorConfront: { fight: 'Αντιμετώπισε τον επισκέπτη' },
      knifeTable: { take: 'Πάρε το μαχαίρι' }
    };
    return (labels[id] && labels[id][verb]) || 'Αλληλεπίδραση';
  }

  waitForInteract(id, verb, objective, guard = null) {
    this.game.ui.setObjective(objective);
    this.currentTargetId = id;
    this.currentVerb = verb;
    this._interactGuard = guard;
    return new Promise((resolve) => { this._interactResolve = resolve; });
  }

  waitKey() {
    return new Promise((resolve) => { this._eResolve = resolve; });
  }

  wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async dialogue(lines) {
    for (const [speaker, text] of lines) {
      this.game.ui.showDialogue(speaker, text);
      await this.waitKey();
    }
    this.game.ui.hideDialogue();
  }

  async fadeTransition(label, timeOfDay, holdMs = 1900) {
    await this.game.ui.fadeToBlack(1.1);
    if (timeOfDay) this.game.setTimeOfDay(timeOfDay);
    if (label) await this.game.ui.showCenterText(label, holdMs);
    else await this.wait(300);
    await this.game.ui.fadeFromBlack(1.1);
  }

  async runDayLoop(day) {
    for (const step of DAY_LOOP) {
      await this.waitForInteract(step.id, step.verb, step.objective);
      await this.handleVerbSideEffect(step.id, step.verb);
      if (step.afterFade) {
        await this.fadeTransition(step.afterFade, null, 1900);
      } else if (step.quickFade) {
        await this.fadeTransition(null, null, 200);
      }
      if (day === 2 && step.afterLunchHook) {
        await this.policeVisit();
      }
    }
  }

  async handleVerbSideEffect(id, verb) {
    if (id === 'frontDoor' && verb === 'exit') {
      this.game.player.teleport(this.game.world.outsidePos, Math.PI);
    }
    if (id === 'frontDoor' && verb === 'enter') {
      this.game.player.teleport(this.game.world.playerStart, 0);
    }
  }

  async policeVisit() {
    const g = this.game;
    audio.playKnock();
    await this.waitForInteract('frontDoor', 'open', 'Κάποιος χτυπάει την πόρτα.');
    audio.playDoorCreak();
    g.world.doorPivot.rotation.y = -1.1;
    g.policeman.show(new THREE.Vector3(1.3, 0, 9.3));
    g.policeman.faceToward(g.player.holder.position);

    g.ui.setObjective('');
    await this.dialogue([
      ['Αστυνομικός', 'Καλησπέρα σας. Συγγνώμη για την ενόχληση. Μήπως είδατε κάποιο περίεργο, τερατόμορφο πλάσμα στην περιοχή τις τελευταίες μέρες;'],
      ['Εσύ', 'Όχι... δεν έχω δει τίποτα περίεργο.'],
      ['Αστυνομικός', 'Εντάξει. Αν δείτε κάτι ασυνήθιστο, καλέστε μας αμέσως. Καλό βράδυ.']
    ]);

    g.policeman.hide();
    g.world.doorPivot.rotation.y = 0;
  }

  async jumpscare() {
    const g = this.game;
    const camPos = g.player.holder.position.clone();
    const forward = g.player.getForward();
    const scarePos = camPos.clone().add(forward.multiplyScalar(0.9));
    scarePos.y = 0;
    g.visitor.show(scarePos);
    g.visitor.faceToward(camPos);
    audio.playJumpscareSound();
    g.ui.flashScare(300);
    await this.wait(400);
    g.visitor.hide();
  }

  async run() {
    const g = this.game;

    g.ui.setObjective('Είναι 3 η ώρα το βράδυ. Επικρατεί απόλυτη ησυχία...');
    await this.wait(2600);
    audio.playKnock();
    await this.waitForInteract('frontDoor', 'open', 'Κάποιος χτυπάει την πόρτα. Πήγαινε να ανοίξεις.');
    audio.playDoorCreak();
    g.world.doorPivot.rotation.y = -1.1;
    g.visitor.show(new THREE.Vector3(-1, 0, 10.5));
    g.visitor.faceToward(g.player.holder.position);

    g.ui.setObjective('');
    await this.dialogue([
      ['Άγνωστος', 'Με συγχωρείτε που ενοχλώ τέτοια ώρα... μπορώ να μείνω στο σπίτι σας για λίγες μέρες;'],
      ['Εσύ', '...Ναι, εντάξει. Πέρασε.']
    ]);

    g.visitor.moveTo(new THREE.Vector3(-6.5, 0, -3), 1.1);
    while (!g.visitor.arrived) await this.wait(50);
    g.world.doorPivot.rotation.y = 0;

    await this.waitForInteract('bed', 'sleep', 'Πήγαινε στο δωμάτιό σου για ύπνο.');
    await this.fadeTransition('Επόμενο πρωί', 'morning');

    await this.runDayLoop(1);

    await this.waitForInteract('bed', 'sleep', 'Πήγαινε για ύπνο.');
    setMessy(g.world);
    await this.fadeTransition('Δεύτερη μέρα', 'morning', 2200);

    await this.jumpscare();

    await this.runDayLoop(2);

    await this.waitForInteract('couch', 'watch', 'Κάθισε να δεις μια ταινία πριν κοιμηθείς.');
    g.setTimeOfDay('evening');
    spawnBags(g.world);
    g.ui.setObjective('');
    await this.wait(1500);

    this.watchForBedroomEntry = true;
    await this.waitForInteract('bed', 'sleep', 'Πήγαινε για ύπνο.');
    this.watchForBedroomEntry = false;
    g.visitor.hide();
    await this.fadeTransition(null, 'night', 300);

    await this.finalConfrontation();
  }

  async maybeTriggerStaring() {
    if (!this.watchForBedroomEntry || this.staringDone) return;
    const p = this.game.player.holder.position;
    if (!this.game.world.bedroomZone.containsPoint(p)) return;
    this.staringDone = true;
    this.watchForBedroomEntry = false;
    this.game.visitor.show(this.game.world.roomPoints.bedroomDoor);
    this.game.visitor.faceToward(p);
    await this.wait(2400);
    this.game.visitor.hide();
  }

  async finalConfrontation() {
    const g = this.game;

    await this.waitForInteract('knifeTable', 'take', 'Ψάξε κάτι να χρησιμοποιήσεις για να αμυνθείς.');
    g.world.knifeProp.visible = false;
    g.showKnife();
    g.ui.setObjective('');
    await this.dialogue([
      ['Εσύ', 'Κατάλαβα ποιος είναι ο εξωγήινος, είναι ο επισκέπτης.']
    ]);

    g.visitor.show(g.world.roomPoints.kitchen);
    g.visitor.faceToward(g.player.holder.position);
    g.ui.setTopBanner('Πήγαινε και νίκησε τον επισκέπτη');
    audio.startHeartbeat();

    await this.waitForInteract('visitorConfront', 'fight', 'Ο επισκέπτης είναι στην κουζίνα.');

    audio.stopHeartbeat();
    audio.playStab();
    g.visitor.hide();
    g.ui.setTopBanner('');
    g.ui.setObjective('');

    await this.policeEpilogue();
    this.win();
  }

  async policeEpilogue() {
    const g = this.game;
    audio.playKnock();
    await this.waitForInteract('frontDoor', 'open', 'Κάποιος χτυπάει την πόρτα.');
    audio.playDoorCreak();
    g.world.doorPivot.rotation.y = -1.1;
    g.policeman.show(new THREE.Vector3(1.3, 0, 9.3));
    g.policeman.faceToward(g.player.holder.position);

    g.ui.setObjective('');
    await this.dialogue([
      ['Αστυνομικός', 'Μπράβο, έπιασες τον επισκέπτη. Θες να σε βάλουμε στην αστυνομία;'],
      ['Εσύ', 'Ναι, θα το ήθελα.']
    ]);

    g.policeman.hide();
    g.world.doorPivot.rotation.y = 0;
  }

  update(dt) {
    if (this.ended) return;
    this.maybeTriggerStaring();
  }

  win() {
    this.ended = true;
    this.game.player.unlock();
    this.game.ui.showEnd('Νίκησες.', 'Έπιασες τον επισκέπτη και έγινες αστυνομικός. Τέλος.');
  }
}
