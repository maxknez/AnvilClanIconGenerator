// Shield decoration configuration. Keep mask order here; assets live in masks/1x.
window.MASK_CONFIG = {
  path: 'masks/1x',
  baseSize: 128,
  sizeOptions: [
    { scale: 2, pixels: 192 },
    { scale: 1.5, pixels: 160 },
    { scale: 1, pixels: 128 }
  ],
  moveStep: 4,
  masks: [
    ['Ancient Bordure', 'm_Anc_Bordure.png'], ['Bar', 'm_Bar.png'], ['Base', 'm_Base.png'], ['Bend', 'm_Bend.png'],
    ['Checky', 'm_Checky.png'], ['Chevron Sinister', 'm_Chevron_Sinister.png'], ['Chief', 'm_Chief.png'],
    ['Cross', 'm_Cross.png'], ['Fess', 'm_Fess.png'], ['Flangel', 'm_Flangel.png'], ['Gyronny', 'm_Gyronny.png'],
    ['Pagan Bordure', 'm_Pag_Bordure.png'], ['Pale 1', 'm_Pale_1.png'], ['Pale', 'm_Pale.png'], ['Pall', 'm_Pall.png'],
    ['Pallet', 'm_Pallet.png'],
    ['Per Bend', 'm_per_Bend.png'], ['Per Chevron', 'm_per_Chevron.png'], ['Per Fess', 'm_per_Fess.png'],
    ['Per Pale', 'm_per_Pale.png'], ['Per Pile', 'm_per_Pile.png'], ['Per Saltire', 'm_per_Saltire.png'],
    ['Quarter', 'm_Quarter.png'], ['Quarterly', 'm_Quarterly.png'], ['Remnant Bordure', 'm_Rem_Bordure.png'],
    ['Saltire', 'm_Saltire.png']
  ].map(([name, file]) => ({ name, file }))
};
