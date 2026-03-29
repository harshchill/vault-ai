# 🎓 Vault AI - Exam Paper Structurer

A Next.js application that transforms exam PDF documents into structured, searchable JSON data using Mistral AI's OCR and language models.

## ✨ Features

- **PDF to Structured JSON**: Convert exam papers from PDF format to structured JSON
- **AI-Powered OCR**: Leverages Mistral OCR for accurate text extraction
- **Intelligent Parsing**: Uses Mistral's language model to understand exam structure
- **Beautiful UI**: Clean, responsive interface built with React and Tailwind CSS
- **Real-time Processing**: Process PDFs in under 60 seconds
- **Detailed Breakdown**: Extract sections, questions, sub-questions, and marks
- **Multiple Views**: View raw markdown, structured JSON, and rendered paper format

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ installed
- A Mistral API key ([Get one here](https://console.mistral.ai/))

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd vault-ai
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   MISTRAL_API_KEY=your_mistral_api_key_here
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📖 Usage

1. Paste a **public PDF URL** of an exam paper into the input field
2. Click **Process** to start the OCR and parsing
3. Wait up to 60 seconds for processing
4. View the results in three formats:
   - **Rendered Paper**: A clean, structured view of the exam
   - **OCR Markdown**: Raw markdown output from the OCR
   - **Structured JSON**: Complete JSON data structure

## 🏗️ Project Structure

```
vault-ai/
├── app/
│   ├── api/
│   │   └── process/
│   │       └── route.js          # Main API endpoint for PDF processing
│   ├── globals.css               # Global styles
│   ├── layout.js                 # Root layout with fonts
│   └── page.js                   # Main page component
├── lib/
│   └── exam-schema.js            # Zod schema for exam validation
├── public/                       # Static assets
├── .env.local                    # Environment variables (create this)
├── next.config.mjs               # Next.js configuration
├── package.json                  # Dependencies and scripts
└── tailwind.config.js            # Tailwind CSS configuration
```

## 🔧 Technologies Used

- **[Next.js 16.2](https://nextjs.org/)**: React framework for production
- **[React 19](https://react.dev/)**: UI library
- **[Mistral AI](https://mistral.ai/)**: OCR and language model APIs
- **[Zod](https://zod.dev/)**: TypeScript-first schema validation
- **[Tailwind CSS 4](https://tailwindcss.com/)**: Utility-first CSS framework

## 📊 Data Structure

The application extracts the following structure from exam papers:

```json
{
  "exam_title": "String",
  "subject": "String",
  "total_marks": "Number or null",
  "duration": "String or null",
  "instructions": ["String"],
  "sections": [
    {
      "section_label": "e.g., Section A",
      "section_title": "String or null",
      "section_marks": "Number or null",
      "section_instructions": "String or null",
      "questions": [
        {
          "question_number": "e.g., 1 or 1a",
          "question_text": "Full question text",
          "marks": "Number or null",
          "sub_questions": [
            {
              "part": "e.g., a, b, i, ii",
              "text": "String",
              "marks": "Number or null"
            }
          ]
        }
      ]
    }
  ]
}
```

## 🛠️ Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## ⚙️ Configuration

The application uses the following environment variables:

| Variable | Description | Required |
|----------|-------------|----------|
| `MISTRAL_API_KEY` | Your Mistral API key for OCR and chat | Yes |

## 🎨 Features in Detail

### OCR Processing
- Uses `mistral-ocr-latest` model for document text extraction
- Processes multi-page PDFs
- Generates clean markdown output

### Intelligent Parsing
- Uses `mistral-small-latest` model for structured data extraction
- Validates output using Zod schemas
- Handles complex exam structures with sections and sub-questions

### UI Components
- Responsive design that works on all devices
- Real-time status updates during processing
- Expandable sections for detailed views
- Error handling with user-friendly messages

## 🚦 API Endpoints

### POST `/api/process`

Processes a PDF URL and returns structured exam data.

**Request Body:**
```json
{
  "pdfUrl": "https://example.com/exam.pdf"
}
```

**Response:**
```json
{
  "success": true,
  "pages_processed": 5,
  "raw_markdown": "...",
  "structured": { /* exam object */ }
}
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

This project is private and not licensed for public use.

## 🐛 Known Limitations

- Only processes publicly accessible PDF URLs
- Maximum processing time: 60 seconds
- Requires valid Mistral API key
- OCR accuracy depends on PDF quality

## 🔮 Future Enhancements

- [ ] Support for local PDF file uploads
- [ ] Multiple language support
- [ ] Export to various formats (Word, Excel)
- [ ] Batch processing for multiple PDFs
- [ ] Enhanced error recovery
- [ ] Answer key extraction

## 🚀 Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme).

Check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

---

Built with ❤️ using Next.js and Mistral AI
