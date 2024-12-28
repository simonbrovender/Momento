import React, { useRef, useEffect } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Bold from '@tiptap/extension-bold';
import Italic from '@tiptap/extension-italic';
import BulletList from '@tiptap/extension-bullet-list';
import OrderedList from '@tiptap/extension-ordered-list';
import ListItem from '@tiptap/extension-list-item';
import Image from '@tiptap/extension-image';
import ImageResize from 'tiptap-extension-resize-image'; // Import the ImageResize extension
import { FaBold, FaItalic, FaListUl, FaListOl, FaImage } from 'react-icons/fa'; // Import icons
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import { FaSave } from 'react-icons/fa';

const Editor = ({ value, onChange }) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Bold,
      Italic,
      BulletList,
      OrderedList,
      ListItem,
      Image,
      ImageResize, // Add the ImageResize extension
	  TextStyle, // Required for inline styling
	  Color, // Enables font color functionality
    ],
    content: value || '',
    onUpdate: ({ editor }) => {
      if (onChange) {
        onChange(editor.getHTML()); // Send updated HTML content to Adalo
      }
    },
  });

  const hiddenRef = useRef(null); // Reference for hidden replica
  const editorRef = useRef(null); // Reference for the editor container

  useEffect(() => {
    if (editor && hiddenRef.current && editorRef.current) {
      const updateHeight = () => {
		const content = editor.getHTML().trim() || '<br>'; // Add `<br>` for empty content
		hiddenRef.current.innerHTML = content.replace(/<p><\/p>/g, '<p><br></p>'); // Replace empty paragraphs
		editorRef.current.style.height = `${hiddenRef.current.scrollHeight}px`;
	  };
	  

      // Initial height adjustment
      updateHeight();

      // Add listener for content updates
      editor.on('update', updateHeight);

      // Cleanup listener on component unmount
      return () => {
        editor.off('update', updateHeight);
      };
    }
  }, [editor]);

  if (!editor) {
    return <div>Loading editor...</div>;
  }

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        editor.chain().focus().setImage({ src: reader.result }).run(); // Insert image into the editor
      };
      reader.readAsDataURL(file); // Read file as a Data URL
    }
  };

  return (
    <div
      style={{
        borderRadius: '5px',
        padding: '10px',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'transparent',
        alignItems: 'stretch',
        height: 'auto',
        minHeight: '100px',
        overflow: 'visible',
      }}
    >
      <style>
        {`
          .ProseMirror:focus {
            outline: none; /* Removes the blue rectangle */
          }
        `}
      </style>
	  <div
  style={{
    marginBottom: '10px',
    display: 'flex',
    justifyContent: 'space-between', // Ensure buttons align to opposite sides
    alignItems: 'center',
  }}
>
{/* Left Side Buttons */}
<div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
  <button
    onClick={() => editor.chain().focus().toggleBold().run()}
    style={{
      cursor: 'pointer',
      border: 'none',
      background: 'none',
      fontSize: '18px',
    }}
    title="Bold"
  >
    <FaBold />
  </button>
  <button
    onClick={() => editor.chain().focus().toggleItalic().run()}
    style={{
      cursor: 'pointer',
      border: 'none',
      background: 'none',
      fontSize: '18px',
    }}
    title="Italic"
  >
    <FaItalic />
  </button>
  <button
    onClick={() => editor.chain().focus().toggleBulletList().run()}
    style={{
      cursor: 'pointer',
      border: 'none',
      background: 'none',
      fontSize: '18px',
    }}
    title="Bullet List"
  >
    <FaListUl />
  </button>
  <button
    onClick={() => editor.chain().focus().toggleOrderedList().run()}
    style={{
      cursor: 'pointer',
      border: 'none',
      background: 'none',
      fontSize: '18px',
    }}
    title="Ordered List"
  >
    <FaListOl />
  </button>
  <label>
    <input
      type="file"
      accept="image/*"
      onChange={handleImageUpload}
      style={{ display: 'none' }}
    />
    <span
      style={{
        cursor: 'pointer',
        fontSize: '18px',
        border: 'none',
        background: 'none',
      }}
      title="Insert Image"
    >
      <FaImage />
    </span>
  </label>
  {/* Save Button */}
  <button
    onClick={() => {
      const currentContent = editor.getHTML(); // Get the current content from the editor
      console.log('Saved content:', currentContent); // Log the content (just for this step)
    }}
    style={{
      cursor: 'pointer',
      border: 'none',
      background: 'none',
      fontSize: '18px',
    }}
    title="Save"
  >
    <FaSave />
  </button>
</div>
  

  {/* Right Side Color Buttons */}
  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
    {[
      { color: 'red', title: 'Red' },
      { color: 'blue', title: 'Blue' },
      { color: 'green', title: 'Green' },
      { color: 'black', title: 'Black' },
      { color: 'purple', title: 'Purple' },
      { color: 'orange', title: 'Orange' },
      { color: 'pink', title: 'Pink' },
      { color: 'brown', title: 'Brown' },
      { color: 'gray', title: 'Gray' },
      { color: 'yellow', title: 'Yellow' },
    ].map(({ color, title }) => (
      <button
        key={color}
        onClick={() => editor.chain().focus().setMark('textStyle', { color }).run()}
        style={{
          width: '24px',
          height: '24px',
          borderRadius: '50%',
          backgroundColor: color,
          border: 'none',
          cursor: 'pointer',
        }}
        title={title}
      />
    ))}
  </div>
</div>
      <div
        ref={editorRef}
        onClick={() => editor.chain().focus().run()}
        style={{
          minHeight: '1140px',
          padding: '12%',
          border: '1px solid #eee',
          borderRadius: '4px',
          fontFamily: 'Arial, sans-serif',
          fontSize: '14px',
          lineHeight: '1.5',
          boxSizing: 'border-box',
          overflowY: 'hidden',
          cursor: 'text',
          backgroundColor: '#ffffff',
        }}
      >
        <EditorContent
			editor={editor}
			style={{
				outline: 'none', // Remove the blue border
			}}
		/>

      </div>
      {/* Hidden replica */}
      <div
        ref={hiddenRef}
        style={{
			visibility: 'hidden',
			position: 'absolute',
			top: 0,
			left: 0,
			zIndex: -1,
			whiteSpace: 'pre-wrap',
			wordWrap: 'break-word',
			width: '100%',
			fontFamily: 'Arial, sans-serif',
			fontSize: '14px',
			lineHeight: '1.5',
			padding: '10px',
			border: '1px solid #eee',
			boxSizing: 'border-box', // Ensure consistent box model
		}}
      />
    </div>
  );
};

export default Editor;
