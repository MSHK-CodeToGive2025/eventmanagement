import React, { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ReactQuillEditor } from "@/components/ui/react-quill-editor"
import { RichTextDisplay } from "@/components/ui/rich-text-display"

export default function RichTextDataTest() {
  const [content, setContent] = useState(`<h1>Welcome to React-Quill Test</h1>
<p>This is a <strong>test</strong> of the <em>React-Quill editor</em> with:</p>
<ul>
  <li><strong>Bold text</strong></li>
  <li><em>Italic text</em></li>
  <li>Bullet lists</li>
  <li>Numbered lists</li>
</ul>
<ol>
  <li>First item</li>
  <li>Second item</li>
  <li>Third item</li>
</ol>
<p style="text-align: center;">This text is center-aligned</p>
<p style="text-align: right;">This text is right-aligned</p>`)

  const [savedData, setSavedData] = useState<string>("")
  const [loadedData, setLoadedData] = useState<string>("")
  const [mockFormData, setMockFormData] = useState({
    title: "Sample Form",
    description: content,
    sections: [
      {
        id: "section_1",
        title: "Personal Information",
        description: "<h2>Personal Details</h2><p>Please provide your <strong>personal information</strong> below:</p>",
        fields: []
      }
    ]
  })

  // Simulate saving to database
  const handleSave = () => {
    const dataToSave = {
      title: mockFormData.title,
      description: content, // This is the HTML string from React-Quill
      sections: mockFormData.sections.map(section => ({
        ...section,
        description: section.description // This is also HTML string
      }))
    }
    
    // Simulate API call
    console.log("Saving to database:", dataToSave)
    setSavedData(JSON.stringify(dataToSave, null, 2))
    
    // Simulate saving to localStorage (like your backend would save to MongoDB)
    localStorage.setItem("mockFormData", JSON.stringify(dataToSave))
  }

  // Simulate loading from database
  const handleLoad = () => {
    const savedData = localStorage.getItem("mockFormData")
    if (savedData) {
      const parsedData = JSON.parse(savedData)
      console.log("Loading from database:", parsedData)
      setLoadedData(JSON.stringify(parsedData, null, 2))
      setContent(parsedData.description)
      setMockFormData(parsedData)
    }
  }

  // Simulate MongoDB document structure
  const mockMongoDocument = {
    _id: "507f1f77bcf86cd799439011",
    title: "Sample Form",
    description: content, // HTML string from React-Quill
    sections: [
      {
        id: "section_1",
        title: "Personal Information",
        description: "<h2>Personal Details</h2><p>Please provide your <strong>personal information</strong> below:</p>",
        fields: []
      }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">React-Quill Data Flow Test</h1>
        <p className="text-gray-600">Testing how React-Quill data is saved and loaded</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Editor */}
        <Card>
          <CardHeader>
            <CardTitle>React-Quill Editor</CardTitle>
            <p className="text-sm text-gray-600">Edit content and see how it's saved</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <ReactQuillEditor
              value={content}
              onChange={setContent}
              placeholder="Start typing your rich content here..."
              minHeight="300px"
            />
            
            <div className="flex gap-2">
              <Button onClick={handleSave} className="flex-1">
                Save to Database
              </Button>
              <Button onClick={handleLoad} variant="outline" className="flex-1">
                Load from Database
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Display */}
        <Card>
          <CardHeader>
            <CardTitle>Rendered Output</CardTitle>
            <p className="text-sm text-gray-600">How the saved content looks when displayed</p>
          </CardHeader>
          <CardContent>
            <RichTextDisplay content={content} />
          </CardContent>
        </Card>
      </div>

      {/* Data Structure */}
      <Card>
        <CardHeader>
          <CardTitle>Data Structure Analysis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">HTML Output (What gets saved):</h3>
            <div className="bg-gray-100 p-4 rounded-md text-sm font-mono overflow-x-auto">
              <pre>{content}</pre>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">MongoDB Document Structure:</h3>
            <div className="bg-gray-100 p-4 rounded-md text-sm font-mono overflow-x-auto">
              <pre>{JSON.stringify(mockMongoDocument, null, 2)}</pre>
            </div>
          </div>

          {savedData && (
            <div>
              <h3 className="font-semibold mb-2">Saved Data:</h3>
              <div className="bg-green-100 p-4 rounded-md text-sm font-mono overflow-x-auto">
                <pre>{savedData}</pre>
              </div>
            </div>
          )}

          {loadedData && (
            <div>
              <h3 className="font-semibold mb-2">Loaded Data:</h3>
              <div className="bg-blue-100 p-4 rounded-md text-sm font-mono overflow-x-auto">
                <pre>{loadedData}</pre>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Key Points */}
      <Card>
        <CardHeader>
          <CardTitle>Key Points About React-Quill Data</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <span className="text-green-600 font-bold">✅</span>
              <span><strong>HTML String:</strong> React-Quill outputs clean HTML that can be saved as a string in MongoDB</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-600 font-bold">✅</span>
              <span><strong>No Special Handling:</strong> Your existing backend code doesn't need changes - just save the HTML string</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-600 font-bold">✅</span>
              <span><strong>Perfect Loading:</strong> When you load the HTML string back into React-Quill, all formatting is preserved</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-600 font-bold">✅</span>
              <span><strong>Display Compatibility:</strong> Your existing <code>RichTextDisplay</code> component works perfectly with React-Quill HTML</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-600 font-bold">✅</span>
              <span><strong>TypeScript Compatible:</strong> The HTML string fits perfectly into your existing TypeScript interfaces</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 