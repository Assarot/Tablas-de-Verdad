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

  const handleGenerate = () => {
    const v = getVariables(formula);
    setVars(v);
    const combos = generateCombinations(v, startWithTrue);
    const subs = getSubexpressionsAndValues(formula, combos);
    // Construir la tabla
    const table = combos.map((combo, i) => {
      const rowData = { ...combo };
      subs.forEach((sub) => {
        rowData[sub.label] = sub.results[i];
      });
      return rowData;
    });
    setSubexpressions(subs);
    setTruthTable(table);
  };

  const displayValue = (val) => {
    if (typeof val !== "boolean") return val;
    const text = binaryMode ? (val ? "1" : "0") : val ? "V" : "F";
    return <span className={val ? "verdadero" : "falso"}>{text}</span>;
  };

  // Esta clase condicional decidirá si todo se muestra centrado
  // (cuando la tabla no existe) o en dos columnas (cuando sí existe).
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

      {/* Sección de la tabla (solo se muestra si truthTable.length > 0) */}
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
        </div>
      )}
    </div>
  );
}

export default App;
