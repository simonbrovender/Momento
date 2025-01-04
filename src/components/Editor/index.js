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

const uploadToCloudinary = async (base64String) => {
	try {
	  console.log("Uploading Base64 to Cloudinary..."); // Debugging log
	  console.log("Base64 String:", base64String.slice(0, 100)); // Log first 100 characters for verification
  
	  const response = await fetch('https://api.cloudinary.com/v1_1/dbfvapzxl/image/upload', {
		method: 'POST',
		headers: {
		  'Content-Type': 'application/json',
		},
		body: JSON.stringify({
		  file: base64String,          // Base64 string
		  upload_preset: 'unsigned',   // Your unsigned preset
		  folder: 'folder',    // Static folder name for all uploads
		}),
	  });
  
	  if (!response.ok) {
		const errorText = await response.text(); // Get error details
		console.error("Cloudinary Error Response:", errorText); // Log full error details
		throw new Error(`Cloudinary upload failed: ${response.statusText}`);
	  }
  
	  const data = await response.json();
	  console.log("Cloudinary Upload Successful:", data); // Log success response
	  return data.secure_url;
	} catch (error) {
	  console.error("Error uploading to Cloudinary:", error);
	  throw error;
	}
  };
  

const Editor = ({ value, userId, entryId, onChange }) => {
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
	content: value || '', // Use the `value` prop to initialize the content
	onUpdate: async ({ editor }) => {
		let htmlContent = editor.getHTML(); // Current HTML content from the editor
	  
		// Regex to find Base64 image strings in the HTML
		const base64ImageRegex = /<img[^>]+src=["'](data:image\/[^;]+;base64[^"']+)["']/g;
	  
		let match;
		let updatedContent = htmlContent; // Start with the original content
	  
		// Iterate through all Base64 strings found in the HTML
		while ((match = base64ImageRegex.exec(htmlContent)) !== null) {
		  const base64String = match[1]; // Extract the Base64 string
	  
		  try {
			// Upload Base64 string to Cloudinary
			const cloudinaryUrl = await uploadToCloudinary(base64String, userId, entryId);
	  
			// Replace the Base64 string with the Cloudinary URL in the HTML content
			updatedContent = updatedContent.replace(base64String, cloudinaryUrl);
		  } catch (error) {
			console.error('Failed to upload image to Cloudinary:', error);
		  }
		}
	  
		// Update the editor's content if changes were made
		if (updatedContent !== htmlContent) {
		  editor.commands.setContent(updatedContent); // Update the editor's content
		}
	  
		// Send updated HTML content back to Adalo
		if (onChange) {
		  onChange(updatedContent);
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

  const handleImageUpload = async (event) => {
	const file = event.target.files[0];
	if (file) {
	  const reader = new FileReader();
	  reader.onload = async () => {
		const base64String = reader.result; // Base64 string from the uploaded file
  
		try {
		  // Upload the Base64 string to Cloudinary
		  const cloudinaryUrl = await uploadToCloudinary(base64String, userId, entryId);
  
		  // Replace the Base64 string with the Cloudinary URL in the editor
		  editor.chain().focus().setImage({ src: cloudinaryUrl }).run();
		} catch (error) {
		  alert('Image upload failed. Please try again.'); // Notify user of failure
		}
	  };
	  reader.readAsDataURL(file); // Read the file as a Base64 string
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
	onClick={async () => {
		const currentContent = editor.getHTML(); // Get the current content from the editor
		const airtableBaseId = "appWmqaUZJE2BydBx"; // Replace with your Airtable Base ID
		const tableName = "Entries"; // Replace with your Airtable Table Name
		const airtableToken = "patAsvrZLUNh4oK8R.90978d3db1f5b57aa9aa7f51f2a0c58c98e9677cc8f2fe3f864076e3ab14f3f4"; // Replace with your Airtable PAT
	
		// Define the URL for the POST request
		const url = `https://api.airtable.com/v0/${airtableBaseId}/${tableName}`;
	
		// Define the request body with the "Entry Content" field
		const body = {
		fields: {
			"Entry Content": currentContent, // This maps to your Airtable field name
			"Entry Title": "New Entry", // You can adjust or make this dynamic
			"User ID": userId, // Adalo User ID
			"Entry ID": entryId // Adalo Entry ID
		},
		};
	
		try {
		// Send a POST request to Airtable
		const response = await fetch(url, {
			method: "POST",
			headers: {
			"Authorization": `Bearer ${airtableToken}`,
			"Content-Type": "application/json",
			},
			body: JSON.stringify(body), // Convert the body to a JSON string
		});
	
		// Check for success
		if (!response.ok) {
			throw new Error(`Error: ${response.status} - ${response.statusText}`);
		}
	
		const data = await response.json(); // Parse the response JSON
		console.log("New entry created successfully:", data);
		alert("Entry saved to Airtable!"); // Notify the user
		} catch (error) {
		console.error("Failed to create entry in Airtable:", error);
		alert("Failed to save entry. Please try again."); // Notify the user
		}
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
