(() => {
 const button = document.querySelector('#sound-toggle');
 const AudioEngine = window.AudioContext || window.webkitAudioContext;
 if (!AudioEngine) return;
 button.hidden = false;

 let audio;
 let master;
 let noise;
 let enabled = true;
 let previous = 0;
 let pending = [];

 function envelope(source, start, duration, volume, attack = .008) {
  const gain = audio.createGain();
  gain.gain.setValueAtTime(.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + attack);
  gain.gain.exponentialRampToValueAtTime(.0001, start + duration);
  source.connect(gain).connect(master);
 }

 function burst(start, duration, volume, from, to, attack) {
  const source = audio.createBufferSource();
  source.buffer = noise;
  const filter = audio.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(from, start);
  filter.frequency.exponentialRampToValueAtTime(to, start + duration);
  source.connect(filter);
  envelope(filter, start, duration, volume, attack);
  source.start(start, Math.random() * (noise.duration - duration), duration);
 }

 function tone(start, duration, volume, from, to, type = 'sine', attack = .008) {
  const voice = audio.createOscillator();
  voice.type = type;
  voice.frequency.setValueAtTime(from, start);
  voice.frequency.exponentialRampToValueAtTime(to, start + duration * .58);
  voice.frequency.exponentialRampToValueAtTime(to * .83, start + duration);
  envelope(voice, start, duration, volume, attack);
  voice.start(start);
  voice.stop(start + duration);
 }

 const cues = [
  { at: .205, until: .34, play(t) {
   burst(t, .12, .72, 1700, 520);
   tone(t, .16, .38, 310, 78, 'triangle');
   burst(t + .045, .53, .25, 4600, 2300, .04);
  }},
  { at: .385, until: .52, play(t) {
   burst(t, .68, .68, 520, 4500, .24);
   tone(t + .10, .46, .11, 380, 2180, 'sine', .20);
  }},
  { at: .765, until: 1.01, play(t) {
   burst(t, 1.7, .28, 1200, 780, .22);
   for (let i = 0; i < 14; i++) {
    const pitch = 170 + Math.random() * 420;
    tone(t + Math.random() * .55, .44 + Math.random() * .8, .046, pitch, pitch * 1.47, 'triangle', .12);
   }
   for (let i = 0; i < 18; i++) {
    const clap = t + .08 + Math.random() * 1.55;
    burst(clap, .075, .24, 2100, 750);
   }
   tone(t + .35, .62, .07, 1000, 1740, 'sine', .09);
  }},
  { at: .865, until: 1.01, play(t) {
   burst(t, .17, .76, 2600, 430);
   tone(t, .16, .22, 200, 62, 'triangle');
   for (let i = 0; i < 14; i++) {
    const flutter = t + .04 + Math.random() * .67;
    burst(flutter, .11, .16, 3600 + Math.random() * 3200, 2300);
   }
  }}
 ];

 function applyVolume() {
  if (master) master.gain.setTargetAtTime(enabled ? .46 : 0, audio.currentTime, .015);
 }

 function unlock() {
  if (!enabled || audio?.state === 'running') return;
  try {
   if (!audio) {
    audio = new AudioEngine();
    master = audio.createGain();
    master.gain.value = 0;
    master.connect(audio.destination);
    noise = audio.createBuffer(1, audio.sampleRate * 2, audio.sampleRate);
    const samples = noise.getChannelData(0);
    for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;
   }
   applyVolume();
   audio.resume().then(() => {
    if (enabled) playCues(pending);
    pending = [];
   }).catch(() => {});
  } catch {
   button.title = '浏览器暂时无法播放音效';
  }
 }

 function onInteraction(event) {
  if (!button.contains(event.target)) unlock();
 }

 window.addEventListener('click', onInteraction);
 window.addEventListener('pointerup', onInteraction, {passive:true});
 window.addEventListener('keydown', onInteraction);
 button.addEventListener('click', () => {
  enabled = !enabled;
  if (enabled) unlock();
  else pending = [];
  applyVolume();
  button.setAttribute('aria-pressed', String(enabled));
  button.textContent = enabled ? '音效：开启' : '音效：关闭';
 });
 unlock();

 function playCues(ready) {
  ready.forEach((cue, index) => cue.play(audio.currentTime + .015 + index * .10));
 }

 window.updateCelebrationSound = (progress, stageVisible) => {
  if (enabled && stageVisible) {
   pending = pending.filter(cue => progress >= cue.at && progress < cue.until);
   const crossed = cues.filter(cue => previous < cue.at && progress >= cue.at && progress < cue.until);
   if (audio?.state === 'running') playCues(crossed);
   else pending.push(...crossed);
  } else {
   pending = [];
  }
  previous = progress;
 };
})();
