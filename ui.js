const el = (id) => document.getElementById(id);

export const UI = {
  objective: el('objective'),
  topBanner: el('topBanner'),
  prompt: el('interactPrompt'),
  dialogueBox: el('dialogueBox'),
  dialogueSpeaker: el('dialogueSpeaker'),
  dialogueText: el('dialogueText'),
  fadeLayer: el('fadeLayer'),
  scareFlash: el('scareFlash'),
  centerText: el('centerText'),
  endScreen: el('endScreen'),
  endTitle: el('endTitle'),
  endSubtitle: el('endSubtitle'),

  setObjective(text) {
    if (!text) { this.objective.classList.add('hidden'); return; }
    this.objective.textContent = text;
    this.objective.classList.remove('hidden');
  },

  setTopBanner(text) {
    if (!text) { this.topBanner.classList.add('hidden'); return; }
    this.topBanner.textContent = text;
    this.topBanner.classList.remove('hidden');
  },

  showPrompt(text) {
    this.prompt.textContent = text;
    this.prompt.classList.remove('hidden');
  },
  hidePrompt() {
    this.prompt.classList.add('hidden');
  },

  showDialogue(speaker, text) {
    this.dialogueSpeaker.textContent = speaker;
    this.dialogueText.textContent = text;
    this.dialogueBox.classList.remove('hidden');
  },
  hideDialogue() {
    this.dialogueBox.classList.add('hidden');
  },

  async flashScare(holdMs = 300) {
    this.scareFlash.style.transition = 'opacity 0.03s ease-out';
    this.scareFlash.style.opacity = '0.9';
    await new Promise((res) => setTimeout(res, holdMs));
    this.scareFlash.style.transition = 'opacity 0.4s ease-in';
    this.scareFlash.style.opacity = '0';
  },

  fadeToBlack(duration = 1.1) {
    this.fadeLayer.style.transition = `opacity ${duration}s ease`;
    this.fadeLayer.classList.add('visible');
    return new Promise((res) => setTimeout(res, duration * 1000));
  },
  fadeFromBlack(duration = 1.1) {
    this.fadeLayer.style.transition = `opacity ${duration}s ease`;
    this.fadeLayer.classList.remove('visible');
    return new Promise((res) => setTimeout(res, duration * 1000));
  },

  async showCenterText(text, holdMs = 1800) {
    this.centerText.textContent = text;
    this.centerText.classList.remove('hidden');
    await new Promise((res) => setTimeout(res, holdMs));
    this.centerText.classList.add('hidden');
  },

  showEnd(title, subtitle) {
    this.endTitle.textContent = title;
    this.endSubtitle.textContent = subtitle;
    this.endScreen.classList.remove('hidden');
  }
};
