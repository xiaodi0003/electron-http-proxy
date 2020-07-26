import React from 'react';
import AceEditor from "react-ace";
import "ace-builds/src-noconflict/mode-javascript";
import "ace-builds/src-noconflict/theme-github";
import "ace-builds/src-noconflict/ext-language_tools";
import './index.less';

const HookCodeAce: React.FC<{value: string; onChange: (arg0: string) => void}> = ({
  value,
  onChange
}) => {
  return (
    <AceEditor
      mode='javascript'
      theme='monokai'
      height='300px'
      width='800px'
      tabSize={2}
      value={value}
      onChange={onChange}
      setOptions={{
        enableBasicAutocompletion: true,
        enableLiveAutocompletion: true,
        enableSnippets: true
      }}
      editorProps={{ $blockScrolling: true }}
    />
  );
};

export default HookCodeAce;
