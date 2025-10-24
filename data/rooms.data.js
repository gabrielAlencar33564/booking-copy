window.DATASETS = window.DATASETS || {};
window.DATASETS["rooms"] = {
  labels: { type: "Tipo de quarto", people: "Quantas pessoas?" },
  rooms: [
    {
      id: "dbl-std",
      name: "Suíte Dupla Standard",
      url: "#",
      beds: [{ icon: "king_bed", count: 1, label: "cama de casal grande" }],
      capacity: 2,
      cta: {
        label: "Visualizar preços",
        url: "your-data.html",
      },
    },
    {
      id: "sup-02",
      name: "Suíte Superior",
      url: "#",
      beds: [{ icon: "king_bed", count: 1, label: "cama de casal grande" }],
      capacity: 4,
      cta: {
        label: "Visualizar preços",
        url: "your-data.html",
      },
    },
    {
      id: "eco-01",
      name: "Quarto Duplo Econômico",
      url: "#",
      beds: [{ icon: "king_bed", count: 1, label: "cama de casal grande" }],
      capacity: 2,
      cta: {
        label: "Visualizar preços",
        url: "your-data.html",
      },
    },
  ],
};
