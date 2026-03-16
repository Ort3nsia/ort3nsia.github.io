/*
  Dati statici dell'app:
  - sezioni della checklist
  - attività flat con ID stabili
  - sequenza massaggio
  - chiavi localStorage
  - palette tema
*/

const SECTIONS = [
      {
        id: "appuntamenti",
        title: "Appuntamenti",
        items: [
          "Mettere appuntamenti sul planning",
          "Chiedere numero di telefono se sono esterni",
          "Mettere la spa negli appuntamenti del ristorante per la frutta"
        ]
      },
      {
        id: "rifornimenti",
        title: "Rifornimenti",
        items: [
          "Teli bianchi",
          "Teli marroni",
          "Bidet",
          "Tappetini",
          "Visi",
          "Prodotti",
          "Kleenex",
          "Ciabattine monouso",
          "Controllare ciabattine sporche negli office",
          "Accappatoi",
          "Tazze",
          "Bicchieri",
          "Acqua",
          "Tisane",
          "Candele"
        ]
      },
      {
        id: "riassetto-pulizia",
        title: "Riassetto e pulizia",
        items: [
          "Riassettare spogliatoio uomo",
          "Riassettare spogliatoio donna",
          "Riassettare stanza 212",
          "Scopare e lavare a terra",
          "Portare giù sacchi verdi",
          "Portare giù vassoi",
          "Fare i vetri",
          "Spazzare sulla vasca idromassaggio",
          "Controllare scarichi doccia ad ogni spa",
          "Fare le ciabattine"
        ]
      }
    ];

    // Generiamo una lista piatta di attività con ID stabili
    const TASKS = SECTIONS.flatMap(section =>
      section.items.map((label, index) => ({
        id: `${section.id}-${index + 1}`,
        sectionId: section.id,
        sectionTitle: section.title,
        label
      }))
    );


    const TOTAL_TASKS = TASKS.length;

const MASSAGE_SEQUENCE = [
      {
        id: "preparazione-arti-inferiori",
        title: "Preparazione arti inferiori",
        subtitle: "Apertura iniziale e oleazione",
        steps: [
          {
            line: "Apertura delle stazioni linfatiche con olio essenziale",
            details: ["tendine di Achille", "cavo popliteo"]
          },
          {
            line: "Oleazione",
            details: ["cocottina al centro dei piedi"]
          }
        ]
      },
      {
        id: "prima-gamba",
        title: "Prima gamba",
        subtitle: "Sequenza completa sul primo arto",
        steps: [
          { line: "Convogliamento a farfalla ×2" },
          { line: "Rotolini / pettine alla coscia" },
          { line: "Convogliamento" },
          { line: "Impastamento coscia" },
          { line: "Convogliamento" },
          { line: "Pompaggio polpacci ×2" },
          { line: "Fontana polpacci" },
          { line: "Convogliamento" },
          { line: "Manovre del piede" },
          { line: "Sollevamento gamba" }
        ]
      },
      {
        id: "passaggio-altra-gamba",
        title: "Passaggio all’altra gamba",
        subtitle: "Transizione tra i due arti inferiori",
        steps: [
          { line: "Yin e Yang" },
          { line: "Ripetere lo stesso procedimento sull’altra gamba" }
        ]
      },
      {
        id: "parte-superiore-corpo",
        title: "Parte superiore del corpo",
        subtitle: "Apertura, oleazione e lavoro cervicale",
        steps: [
          {
            line: "Apertura delle stazioni linfatiche",
            details: ["polso", "zona clavicolare"]
          },
          { line: "Oleazione" },
          { line: "Massaggio del trapezio" },
          { line: "Ripetere a destra e a sinistra" },
          { line: "Spinta sugli omeri" },
          { line: "Massaggio della parte retronucale fino alle fossette" },
          { line: "Cerchietti su tempie e testa" }
        ]
      },
      {
        id: "cambio-posizione-cliente",
        title: "Cambio posizione del cliente",
        subtitle: "Rotazione controllata",
        steps: [
          { line: "Yin e Yang" },
          { line: "Far girare il cliente" }
        ]
      },
      {
        id: "arti-inferiori-seconda-posizione",
        title: "Arti inferiori in seconda posizione",
        subtitle: "Prima gamba e poi ripetizione sull’altra",
        steps: [
          { line: "Prima gamba" },
          { line: "Convogliamento gamba" },
          { line: "Rotolini / pettine" },
          { line: "Convogliamento" },
          { line: "Impastamento coscia" },
          { line: "Convogliamento" },
          { line: "Pompaggio gamba" },
          { line: "Convogliamento" },
          { line: "Rotolini / pettine polpaccio" },
          { line: "Convogliamento" },
          { line: "Impastamento polpaccio" },
          { line: "Convogliamento" },
          { line: "Passaggio all’altra gamba" },
          { line: "Yin e Yang" },
          { line: "Ripetere lo stesso procedimento sull’altra gamba" }
        ]
      },
      {
        id: "schiena",
        title: "Schiena",
        subtitle: "Lavoro centrale lungo la colonna",
        steps: [
          { line: "Pettine lungo la colonna" },
          { line: "Movimenti a infinito, piccoli e grandi, dall’alto verso il basso" },
          { line: "Lavorare il trapezio" },
          { line: "Ripetere dall’altra parte" }
        ]
      },
      {
        id: "chiusura",
        title: "Chiusura",
        subtitle: "Fase finale del trattamento",
        steps: [
          { line: "Coprire il cliente sulla schiena" },
          { line: "Yin e Yang" },
          { line: "Fine" }
        ]
      }
    ];

const STORAGE_KEYS = {
      currentDate: "spaChecklist.currentDate",
      tasksState: "spaChecklist.tasksState",
      completionTimes: "spaChecklist.completionTimes",
      dailyNotes: "spaChecklist.dailyNotes",
      history: "spaChecklist.history",
      lastCompletedTask: "spaChecklist.lastCompletedTask",
      theme: "spaChecklist.theme"
    };

const THEMES = {
      emerald: {
        name: "Smeraldo",
        themeColor: "#f2fcf8",
        iconOuter: "#12b886",
        iconInner: "#f2fcf8",
        iconStroke: "#0b8a65",
        iconCheck: "#0b8a65"
      },
      cipria: {
        name: "Rosa cipria",
        themeColor: "#faf6f3",
        iconOuter: "#d8b7b0",
        iconInner: "#faf6f3",
        iconStroke: "#b98f86",
        iconCheck: "#7d9581"
      }
    };

