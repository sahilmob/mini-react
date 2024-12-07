function createTextElement(text) {
  return {
    type: "TEXT_ELEMENT",
    props: {
      nodeValue: text,
      children: [],
    },
  };
}

function createElement(type, props, ...children) {
  return {
    type,
    props: {
      ...props,
      children: children.map((c) => {
        if (typeof c === "object") {
          return c;
        } else {
          return createTextElement(c);
        }
      }),
    },
  };
}

function render(element, container) {
  const dom =
    element.type === "TEXT_ELEMENT"
      ? document.createTextNode("")
      : document.createElement(element.type);

  Object.keys(element.props).forEach((prop) => {
    if (prop !== "children") {
      dom[prop] = element.props[prop];
    }
  });

  element.props.children.forEach((c) => render(c, dom));

  container.appendChild(dom);
}

const MiniReact = {
  createElement,
  render,
};

/** @jsx MiniReact.createElement */
const element = (
  <div style="background: orange; color: white">
    <h1 title="web dev made simple">Some Text</h1>
  </div>
);

const root = document.getElementById("root");
MiniReact.render(element, root);
