# SmartFrame Scraper

## Overview
This project is a professional image metadata extraction tool designed to scrape image metadata from SmartFrame.com search results. It enables users to extract detailed information from images and export the results in JSON or CSV format. The application aims to provide a robust and efficient solution for gathering image data, including advanced features like VPN IP rotation to ensure reliable and undetected scraping operations.

## User Preferences
- None documented yet

## System Architecture
The application uses a React, Vite, and Tailwind CSS frontend with Radix UI components, an Express.js backend with TypeScript, and PostgreSQL (with SQLite for development) for the database. A Puppeteer-based web scraper handles the core scraping logic.

Key Architectural Decisions and Features:
- **Bulk URL Scraping**: Supports scraping up to 50 URLs per request with real-time progress tracking via WebSockets.
- **Configurable Scraping**: Options for maximum images, auto-scroll behavior, and concurrency levels.
- **Canvas Extraction**: Advanced mechanism for high-quality image extraction, including a critical fix for viewport-aware full-resolution rendering by setting the viewport and element dimensions to 9999x9999 for full-mode extraction and implementing a polling loop to wait for SmartFrame's CSS variables to populate before proceeding with canvas resizing and extraction.
- **Metadata Normalization**: Standardizes extracted metadata fields (title, subject, tags, comments, authors, date taken, copyright).
- **VPN IP Rotation System**: Integrates with NordVPN and Windscribe CLIs, offering multiple rotation strategies (manual, time-based, count-based, adaptive) with secure command execution and IP tracking.
- **Performance Optimizations**: Significant bundle size reduction (removed 72 unused npm packages, 23% CSS bundle reduction), code splitting with `React.lazy()` and `Suspense`, optimized React component rendering using `useMemo` and `useCallback`, and build optimizations (Terser minification, production console.log removal).
- **Sequential Processing**: Enhanced scraping reliability with ordered sequential mode, configurable inter-tab delays, and automatic tab activation.
- **Database**: Uses Drizzle ORM for schema management, with PostgreSQL for production and SQLite for local development.
- **Deployment**: Configured for VM deployment on Replit, running frontend and backend on port 5000.
- **UI/UX**: Utilizes Radix UI for components, with a focus on user-friendly configuration panels for features like VPN settings.

## External Dependencies
- **Frontend**: React, Vite, Tailwind CSS, Wouter (routing), TanStack Query (data fetching), Radix UI.
- **Backend**: Express.js, TypeScript, Drizzle ORM, Puppeteer, WebSocket.
- **Database**: PostgreSQL (@neondatabase/serverless), SQLite (better-sqlite3).
- **VPN Services**: NordVPN CLI, Windscribe CLI.