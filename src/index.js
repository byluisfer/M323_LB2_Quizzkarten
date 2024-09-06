import hh from "hyperscript-helpers";
import { h, diff, patch } from "virtual-dom";
import createElement from "virtual-dom/create-element";

// allows using html tags as functions in javascript
const { div, button, input, form, label, p } = hh(h);

// A combination of Tailwind classes which represent a (more or less nice) button style
const btnStyle = "bg-gradient-to-r from-red-500 to-blue-500 hover:from-red-600 hover:to-blue-600 text-white font-bold py-2 px-4 rounded";

// Messages which can be used to update the model
const MSGS = {
  OPEN_POPUP: "OPEN_POPUP",      
  CLOSE_POPUP: "CLOSE_POPUP",     
  ADD_CARD: "ADD_CARD",          
  DELETE_CARD: "DELETE_CARD",   
  UPDATE_QUESTION: "UPDATE_QUESTION", 
  UPDATE_ANSWER: "UPDATE_ANSWER",     
  EDIT_CARD: "EDIT_CARD",          
  SAVE_CARD: "SAVE_CARD",            
  RATE_CARD: "RATE_CARD",      
};

// View function which represents the UI as HTML-tag functions
function view(dispatch, model) {
  const sortedCards = [...model.cards].sort((a, b) => a.score - b.score); // Sort cards based on their score (menos to more score)

  return div([
    button({ className: `${btnStyle}`, onclick: () => dispatch(MSGS.OPEN_POPUP) }, "+ Add Flashcard"),
    model.showPopup ? addCardForm(dispatch, model) : null, // https://developer.mozilla.org/es/docs/Web/JavaScript/Reference/Operators/Conditional_operator

    ...sortedCards.map((card) => seeCardStyle(card, model.cards.indexOf(card), dispatch, model.showingAnswer === model.cards.indexOf(card))) // AI tool
  ]);
}

// Function to define the form of the Card (popup)
function addCardForm(dispatch, model) {
  const isEditing = model.editingCardIndex !== null;
  return div({ className: "fixed inset-0 bg-gray-800 bg-opacity-75 flex justify-center items-center z-50" }, [
    form({
      className: "bg-white p-6 rounded-lg",
      onsubmit: (e) => mangeFormCard(e, dispatch, model) // https://www.designcise.com/web/tutorial/how-to-access-form-control-elements-in-the-onsubmit-event-handler-in-react
    }, [
      label({ className: "block text-sm font-bold mb-2" }, "Question:"), 
      input({
        className: "border p-2 w-full mb-4",
        type: "text",
        value: model.newQuestion,
        oninput: (e) => dispatch({ type: MSGS.UPDATE_QUESTION, value: e.target.value }),  // https://developer.mozilla.org/en-US/docs/Web/API/Element/input_event
      }),
      label({ className: "block text-sm font-bold mb-2" }, "Answer:"),
      input({
        className: "border p-2 w-full mb-4",
        type: "text",
        value: model.newAnswer,
        oninput: (e) => dispatch({ type: MSGS.UPDATE_ANSWER, value: e.target.value }), // https://developer.mozilla.org/en-US/docs/Web/API/Element/input_event
      }),
      div({ className: "flex justify-between" }, [
        button({ className: btnStyle, type: "submit" }, isEditing ? "Save Changes" : "Add Card"),  
        button({ className: "bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded", onclick: () => dispatch(MSGS.CLOSE_POPUP) }, "Cancel"),
      ])
    ])
  ]);
}

// Function to display each card
function seeCardStyle(card, index, dispatch) {
  return div({ className: "bg-yellow-200 p-4 rounded-lg mt-5 w-1/2 relative" }, [

    button({
      className: "absolute top-2 right-10",
      onclick: () => dispatch({ type: MSGS.EDIT_CARD, card, index }),
    }, "✏️"),

    button({
      className: "absolute top-2 right-2",
      onclick: () => dispatch({ type: MSGS.DELETE_CARD, index }),
    }, "❌"),

    p({ className: "font-bold" }, "Question"), 
    p({ className: "text-lg mb-4" }, card.question),

    button({
      className: "text-blue-500 hover:underline",
      onclick: (e) => {
        e.target.nextElementSibling.style.display = "block";  // https://www.w3schools.com/jsref/prop_element_nextelementsibling.asp
        e.target.nextElementSibling.nextElementSibling.style.display = "flex";  // Display the rating buttons
      },
    }, "Show Answer"),

    p({ className: "text-lg mb-4", style: "display: none;" }, card.answer),  // Hide answer

    // Hide rating buttons
    div({ className: "mt-2", style: "display: none; justify-content: space-around;" }, [
      button({
        className: btnStyle,
        onclick: () => dispatch({ type: MSGS.RATE_CARD, index, score: 0 }), 
        disabled: card.scored  // Disable if already rated
      }, "Bad"),
      button({
        className: btnStyle,
        onclick: () => dispatch({ type: MSGS.RATE_CARD, index, score: 1 }),
        disabled: card.scored  // Disable if already rated
      }, "Good"),
      button({
        className: btnStyle,
        onclick: () => dispatch({ type: MSGS.RATE_CARD, index, score: 2 }),
        disabled: card.scored  // Disable if already rated
      }, "Great")
    ]),

    p({ className: "text-right mt-4" }, `Score: ${card.score}`)
  ]);
}

// Update function which takes a message and a model and returns a new/updated model
function update(msg, model) {
  switch (msg.type) {
    case MSGS.OPEN_POPUP:
      return {
        ...model, // Copies all current properties of the model
        showPopup: true, 
        newQuestion: "",  
        newAnswer: "", 
        editingCardIndex: null 
      };

    case MSGS.CLOSE_POPUP:
      return {
        ...model,
        showPopup: false,  
        editingCardIndex: null  
      };

    case MSGS.ADD_CARD:
      const newCard = {
        question: model.newQuestion, // Use the value of newQuestion
        answer: model.newAnswer, // Use the value of newAnswer
        score: 0,
        scored: false, // To be hide the score
      };
      return {
        ...model,
        cards: [...model.cards, newCard],  // Add the new card to the array of cards
        showPopup: false,
      };

    case MSGS.DELETE_CARD:
      return {
        ...model,
        cards: model.cards.filter((_, i) => i !== msg.index)  // AI Tool
      };

    case MSGS.UPDATE_QUESTION:
      return { ...model, newQuestion: msg.value };

    case MSGS.UPDATE_ANSWER:
      return { ...model, newAnswer: msg.value };

    case MSGS.EDIT_CARD:
      return {
        ...model,
        showPopup: true,
        newQuestion: msg.card.question, 
        newAnswer: msg.card.answer, 
        editingCardIndex: msg.index 
      };

    // AI Tool
    case MSGS.SAVE_CARD:
      const updatedCards = model.cards.map((card, i) =>
        i === model.editingCardIndex
          ? { ...card, question: model.newQuestion, answer: model.newAnswer } 
          : card
      );
      return {
        ...model,
        cards: updatedCards, 
        showPopup: false, 
        newQuestion: "", 
        newAnswer: "", 
        editingCardIndex: null  
      };

    // AI Tool
    case MSGS.RATE_CARD:
      const ratedCards = model.cards.map((card, i) =>
        i === msg.index
          ? { ...card, score: msg.score, scored: true }
          : card
      );
      return { ...model, cards: ratedCards };

    default:
      return model; 
  }
}

// Manage if we are editing or creating a card
function mangeFormCard(e, dispatch, model) {
  if (model.newQuestion && model.newAnswer) {
    if (model.editingCardIndex !== null) {
      dispatch({ type: MSGS.SAVE_CARD });  
    } else {
      dispatch({ type: MSGS.ADD_CARD }); 
    }
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
  cards: [], 
  showPopup: false, 
  newQuestion: "", 
  newAnswer: "", 
  showingAnswer: null, 
};

// The root node of the app (the div with id="app" in index.html)
const rootNode = document.getElementById("app");

// Start the app
app(initModel, update, view, rootNode);