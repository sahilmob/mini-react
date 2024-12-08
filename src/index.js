let nextUnitOfWork = null;
let wipRoot = null;

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

function createDom(fiber) {
  const dom =
    fiber.type === "TEXT_ELEMENT"
      ? document.createTextNode("")
      : document.createElement(fiber.type);

  Object.keys(fiber.props).forEach((prop) => {
    if (prop !== "children") {
      dom[prop] = fiber.props[prop];
    }
  });

  return dom;
}

function render(element, container) {
  wipRoot = {
    dom: container,
    props: {
      children: [element],
    },
  };

  nextUnitOfWork = wipRoot;
}

function commitWork(fiber) {
  if (!fiber) return;
  const domParent = fiber.parent.dom;
  domParent.appendChild(fiber.dom);

  commitWork(fiber.child);
  commitWork(fiber.sibling);
}

function commitRoot() {
  commitWork(wipRoot.child);
  wipRoot = null;
}

function performUnitOfWork(fiber) {
  if (!fiber.dom) {
    fiber.dom = createDom(fiber);
  }

  const elements = fiber.props.children;

  let index = 0;
  let previousSibling = null;

  while (index < elements.length) {
    const element = elements[index];
    const newFiber = {
      type: element.type,
      props: element.props,
      parent: fiber,
      dom: null,
    };

    if (index === 0) {
      fiber.child = newFiber;
    } else {
      previousSibling.sibling = newFiber;
    }

    previousSibling = newFiber;
    index++;
  }

  if (fiber.child) {
    return fiber.child;
  }

  let nextFiber = fiber;

  while (nextFiber) {
    if (nextFiber.sibling) {
      return nextFiber.sibling;
    }
    nextFiber = fiber.parent;
  }

  return nextFiber;
}

function workLoop(deadLine) {
  let shouldYield = false;

  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    shouldYield = deadLine.timeRemaining() < 1;
  }

  if (!nextUnitOfWork && wipRoot) {
    commitRoot();
  }

  requestIdleCallback(workLoop);
}

requestIdleCallback(workLoop);

const MiniReact = {
  createElement,
  createDom,
};

/** @jsx MiniReact.createElement */
const element = (
  <div style="background: orange; color: white">
    <h1 title="web dev made simple">Some Text</h1>
  </div>
);

const root = document.getElementById("root");
MiniReact.createDom(element, root);
