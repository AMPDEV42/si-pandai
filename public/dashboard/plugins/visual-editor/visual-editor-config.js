// Visual Editor Configuration
export const POPUP_STYLES = `
#inline-editor-popup {
  width: 360px;
  position: fixed;
  z-index: 10000;
  background: #161718;
  color: white;
  border: 1px solid #4a5568;
  border-radius: 16px;
  padding: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  flex-direction: column;
  gap: 10px;
  display: none;
}

@media (max-width: 768px) {
  #inline-editor-popup {
    width: calc(100% - 20px);
  }
}

#inline-editor-popup.is-active {
  display: flex;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

#inline-editor-popup.is-disabled-view {
  padding: 10px 15px;
}

#inline-editor-popup textarea {
  height: 100px;
  padding: 4px 8px;
  background: transparent;
  color: white;
  font-family: inherit;
  font-size: 0.875rem;
  line-height: 1.42;
  resize: none;
  outline: none;
}

#inline-editor-popup .button-container {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
`;

export const EDIT_MODE_STYLES = `
  [data-edit-mode-enabled="true"] [data-edit-id] {
    cursor: pointer; 
    outline: 1px dashed #357DF9; 
    transition: outline 0.2s ease;
    position: relative;
  }
  
  [data-edit-mode-enabled="true"] [data-edit-id]:hover {
    outline: 2px solid #357DF9;
    outline-offset: 2px;
  }
  
  [data-edit-mode-enabled="true"] [data-edit-id]::after {
    content: attr(data-edit-id);
    position: absolute;
    top: -20px;
    left: 0;
    background: #357DF9;
    color: white;
    font-size: 10px;
    padding: 2px 6px;
    border-radius: 4px;
    pointer-events: none;
    white-space: nowrap;
  }
`;
