class FlowAiShareHandoff {
  constructor() {
    this.file = null;
    this.job = null;
    this.screen = null;
    this.taken = false;
  }

  attach(file) {
    this.file = file;
    this.taken = false;
  }

  clear() {
    this.file = null;
    this.job = null;
    this.taken = false;
  }

  getFile() {
    return this.file;
  }

  setJob(job) {
    this.job = job;
    this.taken = false;
  }

  takeJob() {
    if (this.taken || !this.job) return null;
    this.taken = true;
    return this.job;
  }

  registerScreen(screen) {
    this.screen = screen;
  }

  unregisterScreen() {
    this.screen = null;
  }

  async confirm() {
    if (!this.screen || !this.screen.ready) {
      return 'NOT_READY';
    }
    // We don't await, it fires flowAiEvents in the background
    this.screen.share();
    return 'STARTED';
  }
}

export const flowAiShareHandoff = new FlowAiShareHandoff();
