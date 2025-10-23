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
        url: "#/your-data?room=dbl-std",
        target: "_self",
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
        url: "#/your-data?room=sup-02",
        target: "_self",
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
        url: "#/your-data?room=eco-01",
        target: "_self",
      },
    },
  ],
};
