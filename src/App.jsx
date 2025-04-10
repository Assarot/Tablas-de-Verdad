import { useState } from "react";
import "./App.css";
import {
  getVariables,
  generateCombinations,
  getSubexpressionsAndValues,
} from "./logicUtils";

const IMPLICATION = "\u2192";
const OPERATORS = ["(", ")", "~", "∧", "∨", IMPLICATION, "↔", "△"];

function App() {
  const [formula, setFormula] = useState("");
  const [truthTable, setTruthTable] = useState([]);
  const [subexpressions, setSubexpressions] = useState([]);
  const [vars, setVars] = useState([]);
  const [startWithTrue, setStartWithTrue] = useState(false);
  const [binaryMode, setBinaryMode] = useState(false);
  const [conclusion, setConclusion] = useState("");

  const handleGenerate = () => {
    const v = getVariables(formula);
    setVars(v);
    const combos = generateCombinations(v, startWithTrue);
    const subs = getSubexpressionsAndValues(formula, combos);
    // Construir la tabla: cada fila incluye los valores de las variables
    // y para cada subexpresión (sin las variables puras) su resultado en cada combinación
    const table = combos.map((combo, i) => {
      const rowData = { ...combo };
      subs.forEach((sub) => {
        rowData[sub.label] = sub.results[i];
      });
      return rowData;
    });
    setSubexpressions(subs);
    setTruthTable(table);

    // Calcular la conclusión a partir de la última subexpresión (la fórmula completa)
    if (subs.length > 0) {
      const finalLabel = subs[subs.length - 1].label;
      const allFinalValues = table.map((row) => row[finalLabel]);
      let concl = "";
      if (allFinalValues.every((v) => v === true)) {
        concl = "Tautología";
      } else if (allFinalValues.every((v) => v === false)) {
        concl = "Contradicción";
      } else {
        concl = "Contingencia";
      }
      setConclusion(concl);
    }
  };

  // Función para limpiar los datos (fórmula, tabla, subexpresiones y conclusión)
  const handleClearAll = () => {
    setFormula("");
    setTruthTable([]);
    setSubexpressions([]);
    setVars([]);
    setConclusion("");
    // Opcionalmente, reinicias también las opciones:
    setStartWithTrue(false);
    setBinaryMode(false);
  };

  const displayValue = (val) => {
    if (typeof val !== "boolean") return val;
    const text = binaryMode ? (val ? "1" : "0") : val ? "V" : "F";
    return <span className={val ? "verdadero" : "falso"}>{text}</span>;
  };

  // La clase del layout cambia según si ya se generó la tabla
  const layoutClass = truthTable.length > 0 ? "two-cols" : "centered";

  return (
    <div className={`main-layout ${layoutClass}`}>
      {/* Sección de la calculadora */}
      <div className="calc-section">
        <h1>Tabla de Verdad</h1>
        <div className="screen">
          <strong>Fórmula:</strong> {formula || "—"}
        </div>

        <textarea
          value={formula}
          onChange={(e) => setFormula(e.target.value)}
          rows={2}
          cols={50}
          placeholder="Escribe aquí tu fórmula..."
        />

        <div className="buttons-row">
          <button onClick={handleGenerate}>Generar Tabla</button>
          <button onClick={handleClearAll}>Limpiar</button>
        </div>

        <div className="buttons-row">
          <label>
            <input
              type="checkbox"
              checked={startWithTrue}
              onChange={() => setStartWithTrue(!startWithTrue)}
            />
            Iniciar con Verdadero (V-V-F-F)
          </label>
          <label>
            <input
              type="checkbox"
              checked={binaryMode}
              onChange={() => setBinaryMode(!binaryMode)}
            />
            Mostrar en formato 1-0
          </label>
        </div>

        <div className="buttons-row">
          {OPERATORS.map((op) => (
            <button key={op} onClick={() => setFormula((prev) => prev + op)}>
              {op}
            </button>
          ))}
          {["p", "q", "r", "s"].map((v) => (
            <button key={v} onClick={() => setFormula((prev) => prev + v)}>
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Sección de la tabla (solo se muestra si truthTable no está vacía) */}
      {truthTable.length > 0 && (
        <div className="table-section">
          <table>
            <thead>
              <tr>
                {vars.map((v) => (
                  <th key={v}>{v}</th>
                ))}
                {subexpressions.map((sub) => (
                  <th key={sub.label}>{sub.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {truthTable.map((row, i) => (
                <tr key={i}>
                  {vars.map((v) => (
                    <td key={v}>{displayValue(row[v])}</td>
                  ))}
                  {subexpressions.map((sub) => (
                    <td key={sub.label}>{displayValue(row[sub.label])}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="conclusion">
            <strong>Conclusión:</strong> {conclusion}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
