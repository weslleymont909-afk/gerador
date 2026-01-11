# **App Name**: PDF Pre-Budget Generator

## Core Features:

- Text Extraction: Extract data (products, quantities, prices, customer details) from the user-pasted text using regex and structured logic.
- Data Normalization: Normalize extracted data to ensure consistency (e.g., remove accents, standardize spacing, convert case).
- PDF Generation: Generate a PDF document based on the extracted and normalized data, precisely matching the specified layout and formatting requirements of the provided image.
- Product Categorization: Categorize products into 'GATO' (cat) and 'CÃO' (dog) sections in the PDF.
- Dynamic Field Completion: Automatically fill in unused product lines in the PDF table with quantity 0 and total R$ 0.00 to maintain visual consistency. Ensure correct computation and placement of values in Total column. Include data related to 'Diferença em cima do valor original'.
- Error Detection (AI-Powered): Implement an AI-powered tool using a large language model to analyze the pasted text for potential errors, such as missing information, incorrect formatting, or inconsistent data. The tool decides when/if to highlight these inconsistencies in the generated PDF (optional highlighting in PDF).
- Download/Print PDF: Provide buttons for users to download the generated PDF or directly print it.

## Style Guidelines:

- Primary color: Light blue (#ADD8E6) for a clean and professional look, inspired by the blue accents in the example pre-budget image.
- Background color: Very light gray (#F5F5F5) for a neutral backdrop that enhances readability.
- Accent color: Soft green (#90EE90) to highlight important information or interactive elements.
- Body and headline font: 'PT Sans', sans-serif, for a modern yet slightly warm and professional look suitable for both headlines and body text, especially for the table contents. Choose the bold variant for headlines and titles in the PDF document.
- Replicate the exact table structure and layout from the provided image, ensuring precise alignment and spacing of elements.
- Minimalist icons to represent download and print actions.