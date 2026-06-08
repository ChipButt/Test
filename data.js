window.PLANUF_DATA = {
  equipment: [
    { category: 'Camera', item: 'Panasonic GH5 body', qty: 3, unit: 350, url: 'https://www.mpb.com/en-uk/search?q=Panasonic%20GH5', owned: true },
    { category: 'Lens', item: 'Close-up lens', qty: 2, unit: 180, url: 'https://www.mpb.com/en-uk/search?q=Panasonic%20Lumix%20lens', owned: true },
    { category: 'Lens', item: 'Wide-angle lens', qty: 1, unit: 220, url: 'https://www.mpb.com/en-uk/search?q=Panasonic%20wide%20angle%20lens', owned: true },
    { category: 'Audio', item: 'Rode NT1-A style microphone', qty: 2, unit: 120, url: 'https://www.thomann.co.uk/search_dir.html?sw=rode%20nt1-a', owned: true },
    { category: 'Audio', item: 'Sennheiser-quality wireless/lapel microphone kit', qty: 2, unit: 250, url: 'https://www.wexphotovideo.com/search/?q=sennheiser%20wireless%20mic', owned: true },
    { category: 'Lighting', item: 'Basic studio/background lighting kit', qty: 1, unit: 300, url: 'https://www.thomann.co.uk/search_dir.html?sw=aputure%20amaran', owned: true },
    { category: 'Video', item: 'ATEM Mini Pro ISO', qty: 1, unit: 495, url: 'https://www.thomann.co.uk/search_dir.html?sw=atem%20mini%20pro%20iso', owned: false },
    { category: 'Storage', item: '128GB SD cards', qty: 9, unit: 18, url: 'https://www.amazon.co.uk/s?k=128gb+sd+card+v30', owned: false },
    { category: 'Power', item: 'GH5 mains power adapters', qty: 3, unit: 35, url: 'https://www.amazon.co.uk/s?k=gh5+dummy+battery+power+adapter', owned: false },
    { category: 'Monitoring', item: 'Headphones for vision mixer and performers', qty: 4, unit: 45, url: 'https://www.thomann.co.uk/search_dir.html?sw=studio%20headphones', owned: false },
    { category: 'Set', item: 'Backdrop frame and first backdrop', qty: 1, unit: 160, url: 'https://www.amazon.co.uk/s?k=backdrop+stand+kit', owned: false },
    { category: 'Cables', item: 'Long HDMI cables', qty: 3, unit: 20, url: 'https://www.amazon.co.uk/s?k=long+hdmi+cable', owned: false }
  ],
  productionTemplates: [
    { id: 'one-shot', name: 'One-shot / single episode', episodes: 1, shootDays: 1, editDays: 1, description: 'A single finished piece of content.' },
    { id: 'mini-series', name: 'Fixed mini-series / arc', episodes: 6, shootDays: 2, editDays: 6, description: 'A planned run with a fixed episode count.' },
    { id: 'ongoing', name: 'Ongoing recurring series', episodes: 10, shootDays: 3, editDays: 10, description: 'A repeatable format with open-ended future episodes.' }
  ],
  defaults: {
    locationHirePerDay: 250,
    crewDayRate: 300,
    castCostPerEpisode: 20,
    editCostPerDay: 160,
    contingencyPercent: 10
  }
};

window.EQUIPMENT = window.PLANUF_DATA.equipment.map(function (row) {
  return [row.category, row.item, row.qty, row.unit, row.url];
});
