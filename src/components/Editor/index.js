import React from 'react';
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
    ],
    content: value || '',
    onUpdate: ({ editor }) => {
      if (onChange) {
        onChange(editor.getHTML()); // Send updated HTML content to Adalo
      }
    },
  });

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
			height: '500px', // Adjust this value to control the overall height
			display: 'flex',
			flexDirection: 'column',
			justifyContent: 'space-between',
			backgroundColor: 'transparent', // Rec3 background set to transparent
		}}
		>
		<div style={{ marginBottom: '10px', display: 'flex', gap: '10px' }}>
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
		</div>
		<div
			onClick={() => editor.chain().focus().run()} // Focus the editor when clicking anywhere in rec2
			style={{
			height: '100%', // Matches the height of rec2
			padding: '10px',
			border: '1px solid #eee',
			borderRadius: '4px',
			fontFamily: 'Arial, sans-serif',
			fontSize: '14px',
			lineHeight: '1.5',
			overflowY: 'auto', // Enables scrolling for longer content
			cursor: 'text', // Indicates the area is clickable for text input
			backgroundColor: '#ffffff', // Rec1/Rec2 background set to white
			}}
		>
			<EditorContent
			editor={editor}
			style={{
				minHeight: '100%',
			}}
			/>
	</div>
      <style>
        {`
          .ProseMirror ul {
            list-style-type: disc;
            padding-left: 20px;
            margin: 0;
          }
          .ProseMirror ol {
            list-style-type: decimal;
            padding-left: 20px;
            margin: 0;
          }
          .ProseMirror li {
            margin-bottom: 5px;
          }
          .ProseMirror img {
            max-width: 100%;
            height: auto;
            margin: 10px 0;
            resize: both; /* Allow resizing */
            overflow: auto;
          }
          .ProseMirror:focus {
            outline: none; /* Removes the blue rectangle */
          }
        `}
      </style>
    </div>
  );
};

export default Editor;
