'use strict';

require('codemirror/mode/javascript/javascript');
require('codemirror/addon/search/searchcursor');
require('codemirror/addon/dialog/dialog');
require('codemirror/addon/dialog/dialog.css');
require('codemirror/addon/search/search');
require('codemirror/addon/selection/mark-selection');
require('codemirror/lib/codemirror.css');
require('../../assets/theme/parallax.css');

const React = require('react');
const CodeMirror = require('codemirror');
require('./pbasic')(CodeMirror);

const keyExtension = require('./key-extension');

const consoleStore = require('../../src/stores/console');
const editorStore = require('../../src/stores/editor');
const deviceStore = require('../../src/stores/device');
const fileStore = require('../../src/stores/file');

const { handleInput } = require('../../src/actions/editor');
const DocumentsStore = require('../../src/stores/documents');

const TransmissionBar = require('./transmission-bar');

const makeToasts = require('../../src/lib/toasts');

function editor(app, opts, done){

  var codeEditor;
  var receivePane;
  var transmission;

  function refreshConsole(){
    const { text } = consoleStore.getState();

    if(receivePane){

      receivePane.setValue(text);

      const last = receivePane.lastLine();

      if(last) {
        receivePane.scrollIntoView(last);
      }
    }
  }

  function highlighter(position, length) {
    if(!codeEditor){
      return;
    }

    const doc = codeEditor.getDoc();

    const anchor = doc.posFromIndex(position);
    const head = doc.posFromIndex(position + length);

    doc.setSelection(anchor, head, { scroll: false });

    const charRect = codeEditor.charCoords(anchor, 'local');
    const halfHeight = codeEditor.getScrollerElement().offsetHeight / 2;
    const halfTextHeight = Math.floor((charRect.bottom - charRect.top) / 2);
    codeEditor.scrollTo(null, charRect.top - halfHeight - halfTextHeight);
  }

  consoleStore.listen(refreshConsole);

  const space = app.workspace;
  const compile = app.compile.bind(app);
  // seems strange to pass highlighter to toasts
  // maybe this should be named "handlers" or something
  const toasts = makeToasts(app.toast, highlighter);

  editorStore.toasts = toasts;
  editorStore.compile = compile;
  editorStore.workspace = space;

  // really stinks to attach these in here
  fileStore.toasts = toasts;
  deviceStore.toasts = toasts;

  app.view('editor', function(el, cb){
    console.log('editor render');

    if(!codeEditor){
      let editorContainer = document.createElement('div');
      editorContainer.style.display = 'flex';
      editorContainer.style.flex = '1';
      editorContainer.style.flexDirection = 'column';
      editorContainer.setAttribute('id', 'editorContainer');
      el.appendChild(editorContainer);

      codeEditor = CodeMirror(editorContainer, {
        mode: 'pbasic',
        theme: 'parallax',
        lineNumbers: true
      });

      codeEditor.on('change', handleInput);

      codeEditor.setOption('styleSelectedText', true);
      codeEditor.setOption('tabSize', 2);
      codeEditor.setOption('extraKeys', {
        'Ctrl-Up': false,
        'Ctrl-Down': false,
        'Tab': false,
        'Shift-Tab': false,
        'Ctrl-T': false
      });
      keyExtension.setup(app);
      editorStore.cm = codeEditor;
      fileStore.documents = new DocumentsStore(codeEditor);
    }

    if(!receivePane) {
      let receiveContainer = document.createElement('div');
      receiveContainer.setAttribute('id', 'receivePane');
      receiveContainer.style.boxShadow = 'inset 0 5px 10px -5px rgba(0, 0, 0, 0.26)';
      receiveContainer.style.backgroundColor = 'white';
      receiveContainer.style.padding = '10px';
      receiveContainer.style.margin = '0';
      receiveContainer.style.overflow = 'auto';
      receiveContainer.style.whiteSpace = 'pre-wrap';
      el.appendChild(receiveContainer);

      receivePane = CodeMirror(receiveContainer, {
        mode: 'none',
        theme: 'none',
        readOnly: true
      });
    }

    if(!transmission) {
      transmission = document.createElement('div');
      el.appendChild(transmission);
      React.render(<TransmissionBar />, transmission);
    }

    cb();
  });

  space.updateContent(opts.initial, done);
}

module.exports = editor;
