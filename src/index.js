import hh from "hyperscript-helpers";
import { h, diff, patch } from "virtual-dom";
import createElement from "virtual-dom/create-element";

// allows using html tags as functions in javascript
const { div, button, input, form, label, p } = hh(h);

// A combination of Tailwind classes which represent a (more or less nice) button style
const btnStyle = "bg-gradient-to-r from-red-500 to-blue-500 hover:from-red-600 hover:to-blue-600 text-white font-bold py-2 px-4 rounded";

// Messages which can be used to update the model
const MSGS = {
  SHOW_POPUP: "SHOW_POPUP",
  CLOSE_POPUP: "CLOSE_POPUP",
  UPDATE_QUESTION: "UPDATE_QUESTION",
  UPDATE_ANSWER: "UPDATE_ANSWER",
  ADD_CARD: "ADD_CARD",
};

// View function which represents the UI as HTML-tag functions
function view(dispatch, model) {
  return div([
    button({ className: `${btnStyle}`, onclick: () => dispatch(MSGS.SHOW_POPUP) }, "+ Add Flashcard"),
    model.showPopup ? addFlashcardForm(dispatch, model) : null,
    ...model.flashcards.map(card => renderCard(card)),
  ]);
}

// Function to show the form for adding a new flashcard
function addFlashcardForm(dispatch, model) {
  return div({ className: "fixed inset-0 bg-gray-800 bg-opacity-75 flex justify-center items-center" }, [
    form({ className: "bg-white p-6 rounded-lg shadow-lg", onsubmit: (e) => handleFormSubmit(e, dispatch, model) }, [
      label({ className: "block text-sm font-bold mb-2" }, "Question:"),
      input({
        className: "border p-2 w-full mb-4",
        type: "text",
        value: model.newQuestion,
        oninput: (e) => dispatch({ type: MSGS.UPDATE_QUESTION, value: e.target.value }),
      }),
      label({ className: "block text-sm font-bold mb-2" }, "Answer:"),
      input({
        className: "border p-2 w-full mb-4",
        type: "text",
        value: model.newAnswer,
        oninput: (e) => dispatch({ type: MSGS.UPDATE_ANSWER, value: e.target.value }),
      }),
      div({ className: "flex justify-between" }, [
        button({ className: btnStyle, type: "submit" }, "Add Card"),
        button({ className: "bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded", onclick: () => dispatch(MSGS.CLOSE_POPUP) }, "Cancel"),
      ])
    ])
  ]);
}

// Function to render a flashcard
function renderCard(card) {
  return div({ className: "bg-yellow-200 p-4 rounded-lg mt-5 w-1/4 relative" }, [ // Añado 'relative' al contenedor
    button({
      className: "absolute top-2 right-2",
      onclick: () => { /* Aquí puedes agregar funcionalidad para eliminar la tarjeta */ },
    }, "❌"),
    p({ className: "font-bold" }, "Question"),
    p({ className: "text-lg mb-4" }, card.question),
    button({
      className: "text-blue-500 hover:underline",
      onclick: () => { /* Aquí puedes agregar funcionalidad para mostrar la respuesta */ },
    }, "Show Answer")
  ]);
}

// Update function which takes a message and a model and returns a new/updated model
function update(msg, model) {
  switch (msg.type) {
    case MSGS.SHOW_POPUP:
      return { ...model, showPopup: true };

    case MSGS.CLOSE_POPUP:
      return { ...model, showPopup: false };

    case MSGS.UPDATE_QUESTION:
      return { ...model, newQuestion: msg.value };

    case MSGS.UPDATE_ANSWER:
      return { ...model, newAnswer: msg.value };

    case MSGS.ADD_CARD:
      const newCard = {
        question: model.newQuestion,
        answer: model.newAnswer,
      };
      return { 
        ...model, 
        showPopup: false, 
        flashcards: [...model.flashcards, newCard], 
        newQuestion: "", 
        newAnswer: "" 
      };

    default:
      return model;
  }
}

// Handles form submission
function handleFormSubmit(e, dispatch, model) {
  e.preventDefault();
  if (model.newQuestion && model.newAnswer) {
    dispatch({ type: MSGS.ADD_CARD });
  }
}

// ⚠️ Impure code below (not avoidable but controllable)
function app(initModel, update, view, node) {
  let model = initModel;
  let currentView = view(dispatch, model);
  let rootNode = createElement(currentView);
  node.appendChild(rootNode);
  function dispatch(msg) {
    if (typeof msg === 'string') msg = { type: msg };
    model = update(msg, model);
    const updatedView = view(dispatch, model);
    const patches = diff(currentView, updatedView);
    rootNode = patch(rootNode, patches);
    currentView = updatedView;
  }
}

// The initial model when the app starts
const initModel = {
  flashcards: [],
  showPopup: false,
  newQuestion: "",
  newAnswer: "",
};

// The root node of the app (the div with id="app" in index.html)
const rootNode = document.getElementById("app");

// Start the app
app(initModel, update, view, rootNode);
