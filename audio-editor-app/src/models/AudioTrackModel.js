export default class AudioTrackModel {
    constructor({ id, blob, type, ref = null }) {
      this.id = id;
      this.blob = blob;
      this.type = type; // e.g. "record" or "import"
      this.ref = ref;
    }
  }
  