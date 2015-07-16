'use strict';

const React = require('react');

const SaveOverlay = require('./save');
const ProjectOverlay = require('./project');
const DownloadOverlay = require('./download');
const DeleteConfirmOverlay = require('./delete-confirm');

const overlayStore = require('../../src/stores/overlay');
const projectStore = require('../../src/stores/project');

const { confirmDelete, changeProject, deleteProject } = require('../../src/actions/project');
const { deleteFile, saveFileAs } = require('../../src/actions/file');
const { hideSave, hideDelete, hideDownload, showProjects, hideProjects } = require('../../src/actions/overlay');
const KeyExtension = require('../editor/key-extension');

function overlays(app, opts, done){

  const { overlay, workspace, userConfig } = app;
  let baseKeys = true;
  let overlayKeys = false;
  const keyExtension = new KeyExtension(app);
  keyExtension.setBaseCommands();

  projectStore.config = userConfig;
  projectStore.workspace = workspace;

  function renderOverlay(component){
    function renderer(el){
      React.render(component, el);
    }

    overlay.render(renderer, { backdrop: true });
  }

  function onOverlayChange(){
    const {
      showSaveOverlay,
      showDeleteOverlay,
      showDownloadOverlay,
      showProjectsOverlay,
      showProjectDeleteOverlay } = overlayStore.getState();

    let component;
    if(showSaveOverlay){
      component = (
        <SaveOverlay
          onAccept={saveFileAs}
          onCancel={hideSave} />
      );
    }

    if(showDeleteOverlay){
      const name = workspace.filename.deref();
      if(name){
        component = (
          <DeleteConfirmOverlay
            name={name}
            onAccept={deleteFile}
            onCancel={hideDelete} />
        );
      }
    }

    if(showDownloadOverlay){
      component = (
        <DownloadOverlay
          onCancel={hideDownload} />
      );
    }

    if(showProjectsOverlay){
      component = (
        <ProjectOverlay
          workspace={workspace}
          onAccept={changeProject}
          onDelete={confirmDelete}
          onCancel={hideProjects} />
      );
    }

    if(showProjectDeleteOverlay){
      const { deleteProjectName } = projectStore.getState();
      component = (
        <DeleteConfirmOverlay
          name={deleteProjectName}
          onAccept={deleteProject}
          onCancel={showProjects} />
      );
    }

    if(component){
      renderOverlay(component);
    } else {
      // if there is a change and every state is false, hide overlay
      overlay.hide();
    }

    if (showSaveOverlay && !overlayKeys) {
      keyExtension.removeBaseCommands();
      keyExtension.setOverlayCommands();
      overlayKeys = true;
      baseKeys = false;
    }

    if (!showSaveOverlay && !baseKeys) {
      keyExtension.removeOverlayCommands();
      keyExtension.setBaseCommands();
      overlayKeys = false;
      baseKeys = true;
    }

  }

  overlayStore.listen(onOverlayChange);

  done();
}

module.exports = overlays;
