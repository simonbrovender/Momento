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
  
  const processTags = async (tagsString, entryId, airtableBaseId, airtableToken) => {
    const tagsTable = "Tags";
    const entriesTable = "Entries";
    const tagsUrl = `https://api.airtable.com/v0/${airtableBaseId}/${tagsTable}`;
    const entryUrl = `https://api.airtable.com/v0/${airtableBaseId}/${entriesTable}/${entryId}`;
    const tags = tagsString.split('{}').map(tag => tag.trim()).filter(Boolean);
  
    try {
      // Retrieve the current "Tags" field for the entry
      const entryResponse = await fetch(entryUrl, {
        headers: {
          Authorization: `Bearer ${airtableToken}`,
        },
      });
      if (!entryResponse.ok) {
        throw new Error(`Failed to fetch entry: ${entryResponse.statusText}`);
      }
      const entryData = await entryResponse.json();
      const currentTagIds = entryData.fields.Tags || []; // Existing tag IDs or an empty array
  
      for (const tag of tags) {
        let tagId;
        try {
          // Check if the tag exists
          const existingTagResponse = await fetch(
            `${tagsUrl}?filterByFormula=${encodeURIComponent(`{Tag Name}="${tag}"`)}`,
            {
              headers: {
                Authorization: `Bearer ${airtableToken}`,
              },
            }
          );
          const existingTagData = await existingTagResponse.json();
  
          if (existingTagData.records.length > 0) {
            // Tag exists, get its ID
            tagId = existingTagData.records[0].id;
          } else {
            // Create a new tag
            const newTagResponse = await fetch(tagsUrl, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${airtableToken}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                fields: { "Tag Name": tag },
              }),
            });
            const newTagData = await newTagResponse.json();
            tagId = newTagData.id;
          }
  
          // Add the tag ID to the list of associated tags (if not already added)
          if (tagId && !currentTagIds.includes(tagId)) {
            currentTagIds.push(tagId);
          }
        } catch (error) {
          console.error(`Failed to process tag: "${tag}". Error:`, error);
        }
      }
  
      // Update the entry with the full list of associated tags
      await fetch(entryUrl, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${airtableToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fields: {
            Tags: currentTagIds, // Updated list of tag IDs
          },
        }),
      });
    } catch (error) {
      console.error(`Failed to associate tags with entry: ${entryId}. Error:`, error);
    }
  };  

  const Editor = ({ value, userId, entryId, entryTitle, tags, onChange }) => {
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
{/* Toolbar */}
<div
  style={{
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'sticky', // Make the toolbar sticky
    top: '10px', // Stick to the top of the viewport
    zIndex: '1000', // Ensure it stays above other content
    backgroundColor: '#DAE0FF', // Prevent content from showing through
    padding: '15px 20px', // Add some spacing for aesthetic
    border: 'none', // Optional: Visual separation from the editor
	borderRadius: '70px', // Add 8px border radius for rounded corners
	width: 'calc(100% - 40px)', // Make the width 20px narrower than the input field
	margin: '0 auto', // Center the toolbar horizontally
    marginBottom: '20px',
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
		color: '#454746',
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
		color: '#454746',
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
		color: '#454746',
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
		color: '#454746',
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
		  color: '#454746',
        }}
        title="Insert Image"
      >
        <FaImage />
      </span>
    </label>

  {/* Save Button */}
  <button
	onClick={async () => {
		const currentContent = editor.getHTML(); // Get the current content as an HTML string
	
		// Remove image tags from the HTML before extracting plain text
		const contentWithoutImages = currentContent.replace(/<img[^>]*>/g, ""); // Remove all <img> tags
		const plainTextContent = contentWithoutImages.replace(/<[^>]+>/g, ""); // Remove all remaining HTML tags
	
		// Extract all image URLs from the original content
		const imageUrlRegex = /<img[^>]+src=["']([^"']+)["']/g;
		let match;
		const imageUrls = [];
	
		// Collect all image URLs into an array
		while ((match = imageUrlRegex.exec(currentContent)) !== null) {
		imageUrls.push(match[1]);
		}
	
		// Assocaite tags with new entry
    const tagsInput = tags || ""; // Use the `tags` prop or default to an empty string

		const airtableBaseId = "appWmqaUZJE2BydBx"; // Replace with your Airtable Base ID
		const entriesTable = "Entries"; // Replace with your Entries Table Name
		const imagesTable = "Images"; // Replace with your Images Table Name
		const airtableToken = "patAsvrZLUNh4oK8R.90978d3db1f5b57aa9aa7f51f2a0c58c98e9677cc8f2fe3f864076e3ab14f3f4"; // Replace with your Airtable PAT
	
		const entriesUrl = `https://api.airtable.com/v0/${airtableBaseId}/${entriesTable}`;
		const imagesUrl = `https://api.airtable.com/v0/${airtableBaseId}/${imagesTable}`;
	
		// Save the entry content to Airtable
    const currentEntryTitle = entryTitle || "Untitled Entry"; // Use the Entry Title prop or a fallback value
		const entryBody = {
			fields: {
			  "Formatted Text": currentContent, // Full HTML content
			  "Plain Text": plainTextContent, // Clean plain text without images or formatting
			  "Entry Title": currentEntryTitle, // Use the Entry Title prop from Adalo
			  "User ID": userId, // Adalo User ID
			  "Entry ID": entryId, // Adalo Entry ID
			  "Photo URL": imageUrls[0] || "", // Save the first image URL as text (if available)
			  "Cover Photo": imageUrls[0] ? [{ url: imageUrls[0] }] : undefined, // Save the first image as an attachment (if available)
			},
		  };
		  
	
		try {
		// Save the entry to the Entries table
		const entryResponse = await fetch(entriesUrl, {
			method: "POST",
			headers: {
			Authorization: `Bearer ${airtableToken}`,
			"Content-Type": "application/json",
			},
			body: JSON.stringify(entryBody),
		});
	
		if (!entryResponse.ok) {
			throw new Error(`Error: ${entryResponse.status} - ${entryResponse.statusText}`);
		}
	
		const entryData = await entryResponse.json();
		const entryRecordId = entryData.id; // Retrieve the record ID of the newly created entry
	
		console.log("New entry created successfully:", entryData);
	
		// Save each image to the Images table
		for (const imageUrl of imageUrls) {
			try {
			const imageBody = {
				fields: {
				"Image File": [{ url: imageUrl }], // Attach the image URL
				"Photo URL": imageUrl, // Save the image URL as plain text
				"Related Entry": [entryRecordId], // Use the record ID for linking
				},
			};
	
			const imageResponse = await fetch(imagesUrl, {
				method: "POST",
				headers: {
				Authorization: `Bearer ${airtableToken}`,
				"Content-Type": "application/json",
				},
				body: JSON.stringify(imageBody),
			});
	
			if (!imageResponse.ok) {
				const errorDetails = await imageResponse.text();
				console.error("Airtable Image Upload Error Details:", errorDetails);
				throw new Error(`Error: ${imageResponse.status} - ${imageResponse.statusText}`);
			}
	
			const imageData = await imageResponse.json();
			console.log("Image added successfully:", imageData);
			} catch (error) {
			console.error("Failed to save image in Airtable:", error);
			alert("Failed to save an image. Please try again.");
			}
		}
	
    if (tagsInput && entryRecordId) {
      await processTags(tagsInput, entryRecordId, airtableBaseId, airtableToken);
   }   
    
    alert("Entry, images, and tags saved to Airtable!"); // Notify user    
		} catch (error) {
		console.error("Failed to save entry or images in Airtable:", error);
		alert("Failed to save entry or images. Please try again."); // Notify user
		}
	}}  
  
  style={{
    cursor: "pointer",
    border: "none",
    background: "none",
    fontSize: "18px",
	color: '#454746',
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
      { color: 'orange', title: 'Orange' },
      { color: 'yellow', title: 'Yellow' },
      { color: 'green', title: 'Green' },
      { color: 'blue', title: 'Blue' },
      { color: 'purple', title: 'Purple' },
      { color: 'pink', title: 'Pink' },
      { color: 'gray', title: 'Gray' },
      { color: 'black', title: 'Black' },

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
          border: '1px solid #ddd',
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
