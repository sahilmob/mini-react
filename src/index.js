let nextUnitOfWork = null;
let wipRoot = null;
let currentRoot = null;
let deletions = null;

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
    alternate: currentRoot,
  };

  deletions = [];

  nextUnitOfWork = wipRoot;
}

const isEvent = (key) => key.startsWith("on");
const isProperty = (key) => key !== "children" && !isEvent(key);
const isNew = (prev, next) => (key) => prev[key] !== next[key];
const isGone = (_prev, next) => (key) => !(key in next);

Object.keys(prevProps)
  .filter(isEvent)
  .filter(isNew(prevProps, nextProps) || isGone(prevProps, nextProps))
  .forEach((name) => {
    const eventType = name.toLowerCase().substring(2);
    prevProps.dom.removeEventListener(eventType, prevProps[name]);
  });

Object.keys(nextProps)
  .filter(isEvent)
  .filter(isNew(prevProps, nextProps))
  .forEach((name) => {
    const eventType = name.toLowerCase().substring(2);
    prevProps.dom.addEventListener(eventType, prevProps[name]);
  });

function updateDom(dom, prevProps, nextProps) {
  Object.keys(prevProps)
    .filter(isProperty)
    .filter(isGone(prevProps, nextProps))
    .forEach((name) => (dom[name] = ""));

  Object.keys(nextProps)
    .filter(isProperty)
    .filter(isNew(prevProps, nextProps))
    .forEach((name) => (dom[name] = nextProps[name]));
}

function commitWork(fiber) {
  if (!fiber) return;
  const domParent = fiber.parent.dom;
  if (fiber.effectTag === "PLACEMENT" && fiber.dom !== null) {
    domParent.appendChild(fiber.dom);
  } else if (fiber.effectTag === "DELETION") {
    domParent.removeChild(fiber.dom);
  } else if (fiber.effectTag === "UPDATE" && fiber.dom !== null) {
    updateDom(fiber.dom, fiber.alternate.pops, fiber.props);
  }

  commitWork(fiber.child);
  commitWork(fiber.sibling);
}

function commitRoot() {
  deletions.forEach((fiber) => commitWork(fiber));
  commitWork(wipRoot.child);
  currentRoot = wipRoot;
  wipRoot = null;
}

function reconcileChildren(wipFiber, elements) {
  let index = 0;
  let previousSibling = null;
  let oldFiber = wipFiber.alternate && wipFiber.alternate.child;

  while (index < elements.length || oldFiber) {
    const element = elements[index];
    const newFiber = null;
    const sameType = oldFiber && element && oldFiber.type === element.type;

    if (sameType) {
      newFiber = {
        type: oldFiber.typ,
        props: element.props,
        dom: oldFiber.dom,
        parent: wipFiber,
        alternate: oldFiber,
        effectTag: "UPDATE",
      };
    } else if (element && !sameType) {
      newFiber = {
        type: element.type,
        props: element.props,
        dom: null,
        parent: wipFiber,
        alternate: null,
        effectTag: "PLACEMENT",
      };
    } else if (oldFiber && !sameType) {
      oldFiber.effectTag = "DELETION";
      deletions.push(oldFiber);
    }

    if (index === 0) {
      wipFiber.child = newFiber;
    } else {
      previousSibling.sibling = newFiber;
    }

    if (oldFiber) {
      oldFiber = oldFiber.sibling;
    }

    previousSibling = newFiber;
    index++;
  }
}

function performUnitOfWork(fiber) {
  if (!fiber.dom) {
    fiber.dom = createDom(fiber);
  }

  const elements = fiber.props.children;

  reconcileChildren(fiber, elements);

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
  render,
  createElement,
};

/** @jsx MiniReact.createElement */
const element = (
  <div style="background: orange; color: white">
    <h1 title="web dev made simple">Some Text</h1>
  </div>
);

const root = document.getElementById("root");
MiniReact.render(element, root);
