// -------------------------------------
// 1) Normalizar + tokenizar + toPostfix
// (igual que antes, con Shunting Yard)
// -------------------------------------
function normalize(expr) {
  return expr.replace(/->/g, "\u2192").replace(/<->/g, "↔").replace(/\^/g, "∧");
}

function tokenize(expr) {
  const tokens = [];
  let i = 0;
  while (i < expr.length) {
    const c = expr[i];
    if (/\s/.test(c)) {
      i++;
      continue;
    }
    if (c === "(" || c === ")") {
      tokens.push(c);
      i++;
      continue;
    }
    if (/[a-z]/.test(c)) {
      tokens.push(c);
      i++;
      continue;
    }
    if ("~∧∨△→↔".includes(c)) {
      tokens.push(c);
      i++;
      continue;
    }
    console.warn("Carácter no reconocido:", c);
    i++;
  }
  return tokens;
}

const precedence = {
  "~": 5,
  "∧": 4,
  "∨": 3,
  "△": 3,
  "→": 2,
  "↔": 1,
};

const associativity = {
  "~": "right",
  "∧": "left",
  "∨": "left",
  "△": "left",
  "→": "left",
  "↔": "left",
};

function toPostfix(tokens) {
  const outputQueue = [];
  const opStack = [];

  tokens.forEach((token) => {
    if (/[a-z]/.test(token)) {
      outputQueue.push(token);
    } else if (token === "(") {
      opStack.push(token);
    } else if (token === ")") {
      while (opStack.length && opStack[opStack.length - 1] !== "(") {
        outputQueue.push(opStack.pop());
      }
      opStack.pop(); // Quita "("
    } else {
      // Operador
      const o1 = token;
      while (opStack.length) {
        const top = opStack[opStack.length - 1];
        if (top === "(") break;
        const o2 = top;
        const o1Prec = precedence[o1];
        const o2Prec = precedence[o2];
        const condLeft = associativity[o1] === "left" && o1Prec <= o2Prec;
        const condRight = associativity[o1] === "right" && o1Prec < o2Prec;
        if (condLeft || condRight) {
          outputQueue.push(opStack.pop());
        } else {
          break;
        }
      }
      opStack.push(o1);
    }
  });

  while (opStack.length) {
    outputQueue.push(opStack.pop());
  }

  return outputQueue;
}

// -------------------------------------
// 2) Construir un árbol desde la notación postfija
// -------------------------------------

/**
 * Cada nodo puede ser:
 *  - { type: 'var', value: 'p' }
 *  - { type: 'unary', op: '~', child: Node }
 *  - { type: 'binary', op: '→', left: Node, right: Node }
 */
function buildParseTree(postfix) {
  const stack = [];
  postfix.forEach((token) => {
    if (/[a-z]/.test(token)) {
      // variable
      stack.push({ type: "var", value: token });
    } else if (token === "~") {
      // unario
      const child = stack.pop();
      stack.push({ type: "unary", op: token, child });
    } else {
      // binario
      const right = stack.pop();
      const left = stack.pop();
      stack.push({ type: "binary", op: token, left, right });
    }
  });
  // último nodo es la raíz
  return stack.pop();
}

// -------------------------------------
// 3) Generar subexpresiones en orden
// -------------------------------------

/**
 * Recorre el árbol en "orden de evaluación" (post-order),
 * devolviendo un array de nodos (cada nodo = subexpresión).
 * El último nodo del array es la expresión completa.
 */
function collectSubformulas(root) {
  const list = [];
  function postOrder(node) {
    if (!node) return;
    if (node.type === "var") {
      // es hoja
      list.push(node);
      return;
    }
    if (node.type === "unary") {
      postOrder(node.child);
      list.push(node);
    } else if (node.type === "binary") {
      postOrder(node.left);
      postOrder(node.right);
      list.push(node);
    }
  }
  postOrder(root);
  return list;
}

// -------------------------------------
// 4) Convertir un nodo en su string (subexpresión)
// -------------------------------------
function nodeToString(node) {
  if (node.type === "var") {
    return node.value; // p, q, r, etc.
  }
  if (node.type === "unary") {
    // ~ ( child )
    return `~(${nodeToString(node.child)})`;
  }
  // binary
  // ( left op right )
  return `(${nodeToString(node.left)}${node.op}${nodeToString(node.right)})`;
}

// -------------------------------------
// 5) Evaluar un nodo dada una combinación
// -------------------------------------
function evalNode(node, combo) {
  if (node.type === "var") {
    return combo[node.value]; // true/false
  }
  if (node.type === "unary") {
    const childVal = evalNode(node.child, combo);
    return !childVal;
  }
  // binary
  const leftVal = evalNode(node.left, combo);
  const rightVal = evalNode(node.right, combo);

  switch (node.op) {
    case "∧":
      return leftVal && rightVal;
    case "∨":
      return leftVal || rightVal;
    case "△":
      return leftVal !== rightVal;
    case "→":
      return !leftVal || rightVal;
    case "↔":
      return leftVal === rightVal;
    default:
      console.warn("Operador desconocido:", node.op);
      return false;
  }
}

// -------------------------------------
// 6) Función para obtener subexpresiones + evaluarlas
//    Devuelve un array con info de { label, results[] }
//    donde label = string de subexpresión
//          results[i] = valor en la i-ésima combinación
// -------------------------------------

export function getSubexpressionsAndValues(expr, combos) {
  // 1) Normalizar + tokenizar + postfix
  const normalized = normalize(expr);
  const tokens = tokenize(normalized);
  const postfix = toPostfix(tokens);

  // 2) Construir árbol
  const root = buildParseTree(postfix);

  // 3) Recopilar nodos en post-order
  const nodes = collectSubformulas(root); // array de nodos en orden post-order

  // 4) Filtrar los nodos de tipo var (solo queremos unarios y binarios)
  const filteredNodes = nodes.filter((node) => node.type !== "var");

  // 5) Para cada nodo, obtenemos un label (string) y su valor en cada combinación
  const subexprs = filteredNodes.map((node) => {
    const label = nodeToString(node);
    const results = combos.map((combo) => evalNode(node, combo));
    return { label, results };
  });

  return subexprs; // solo subexpresiones, sin las variables puras
}

// -------------------------------------
// 7) Generar combinaciones (igual que antes)
// -------------------------------------
export function generateCombinations(variables, startWithTrue = false) {
  const total = Math.pow(2, variables.length);
  const combos = [];
  for (let i = 0; i < total; i++) {
    const row = {};
    variables.forEach((v, index) => {
      let bit = (i >> (variables.length - index - 1)) & 1;
      if (startWithTrue) {
        bit = 1 - bit;
      }
      row[v] = Boolean(bit);
    });
    combos.push(row);
  }
  return combos;
}

// Detectar variables (simple)
export function getVariables(expr) {
  const normalized = normalize(expr);
  const tokens = tokenize(normalized);
  const vars = new Set();
  tokens.forEach((t) => {
    if (/[a-z]/.test(t)) {
      vars.add(t);
    }
  });
  return [...vars];
}
