# Project Blueprint

## Overview

This project is a Next.js application that allows users to convert PDF files to Excel files. The application provides a user-friendly interface for uploading PDF files and then processes them on the server to generate an Excel file.

## Features & Design

### File Upload
- The application features a file upload component that allows users to select a PDF file from their local machine.
- The file upload component supports both clicking to select a file and dragging and dropping a file onto the component.
- The component provides visual feedback to the user when a file is dragged over it and when a file has been successfully selected.
- A loading indicator (spinner) is displayed during file processing.

### Data Extraction and Export
- The application extracts structured data from the PDF, including wagon information, fiscal notes, and other details.
- The generated Excel file contains multiple sheets:
  - **Dados**: The main data extracted from the PDF.
  - **Desmembres**: A summary of the 'desmembre' operations.
  - **CNPJ**: A sheet containing the wagon number and the extracted CNPJ of the sender.

### Styling
- The application uses Tailwind CSS for styling.
- The file upload component has a clean and modern design, with a dashed border that changes color to indicate different states (e.g., normal, drag over, file selected).
- The overall layout is centered and user-friendly.

## Current Plan

The immediate plan is to continue developing the core functionality of the application, which includes:
- Processing the uploaded PDF file on the server.
- Converting the PDF data to an Excel format.
- Allowing the user to download the generated Excel file.