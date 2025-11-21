import { Page } from 'puppeteer';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { spawn } from 'child_process';
import { INJECTED_JAVASCRIPT } from './extension-files';
import { loadScraperConfig } from '../config-loader';
import type { ScraperConfig } from '../../types';

interface ImageMetadata {
  titleField?: string | null;
  subjectField?: string | null;
  tags?: string | null;
  comments?: string | null;
  authors?: string | null;
  dateTaken?: string | null;
  copyright?: string | null;
}

/**
 * SmartFrame Canvas Image Extractor
 * Handles extraction of full-resolution canvas images from SmartFrame embeds
 */
export class SmartFrameCanvasExtractor {
  private config: ScraperConfig;

  constructor() {
    // Load configuration from scraper.config.json
    this.config = loadScraperConfig();
  }

  /**
   * Helper method to wait for a specified duration
   */
  private async wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Embed EXIF metadata into a JPG file using exiftool
   * @param jpgPath - Path to the JPG file
   * @param metadata - Metadata to embed
   */
  private async embedExifMetadata(jpgPath: string, metadata: ImageMetadata): Promise<void> {
    return new Promise((resolve, reject) => {
      const args: string[] = ['-overwrite_original'];

      // Map our metadata fields to EXIF/IPTC/XMP tags
      // Using distinct fields to avoid overwrites
      
      if (metadata.titleField) {
        args.push(`-IPTC:ObjectName=${metadata.titleField}`);
        args.push(`-XMP:Title=${metadata.titleField}`);
        args.push(`-IPTC:Headline=${metadata.titleField}`);
      }
      
      if (metadata.subjectField) {
        // Use dedicated subject fields - NOT keywords
        args.push(`-XMP:PersonInImage=${metadata.subjectField}`);
        args.push(`-IPTC:SubjectReference=${metadata.subjectField}`);
      }
      
      if (metadata.comments) {
        // Comments/Description - distinct from subject
        args.push(`-IPTC:Caption-Abstract=${metadata.comments}`);
        args.push(`-XMP:Description=${metadata.comments}`);
        args.push(`-EXIF:ImageDescription=${metadata.comments}`);
      }
      
      if (metadata.authors) {
        args.push(`-IPTC:By-line=${metadata.authors}`);
        args.push(`-XMP:Creator=${metadata.authors}`);
        args.push(`-EXIF:Artist=${metadata.authors}`);
      }
      
      if (metadata.copyright) {
        args.push(`-IPTC:CopyrightNotice=${metadata.copyright}`);
        args.push(`-XMP:Rights=${metadata.copyright}`);
        args.push(`-EXIF:Copyright=${metadata.copyright}`);
      }
      
      if (metadata.dateTaken) {
        // Robust date parsing and formatting without timezone conversion
        try {
          // Parse ISO date string directly to avoid timezone conversion
          // Handles formats: YYYY-MM-DD, YYYY-MM-DDTHH:MM, YYYY-MM-DDTHH:MM:SS, 
          // YYYY-MM-DDTHH:MM:SS.mmm, YYYY-MM-DDTHH:MM:SS±HH:MM, etc.
          const isoMatch = metadata.dateTaken.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?(?:\.\d+)?(?:[+-]\d{2}:\d{2}|Z)?)?/);
          
          if (isoMatch) {
            const [, year, month, day, hours = '00', minutes = '00', seconds = '00'] = isoMatch;
            
            // Format as EXIF date: YYYY:MM:DD HH:MM:SS
            const exifDate = `${year}:${month}:${day} ${hours}:${minutes}:${seconds}`;
            
            args.push(`-EXIF:DateTimeOriginal=${exifDate}`);
            args.push(`-EXIF:CreateDate=${exifDate}`);
            args.push(`-XMP:DateCreated=${metadata.dateTaken}`);
          } else {
            console.warn(`[SmartFrame Canvas] Date format not recognized, skipping date embedding: ${metadata.dateTaken}`);
          }
        } catch (error) {
          console.warn(`[SmartFrame Canvas] Error parsing date, skipping date embedding: ${metadata.dateTaken}`, error);
        }
      }
      
      if (metadata.tags) {
        // Split tags by comma and add as keywords
        // Use += operator to add each keyword individually
        const tagList = metadata.tags.split(',').map(t => t.trim()).filter(t => t);
        if (tagList.length > 0) {
          // Add each keyword individually to both IPTC and XMP
          tagList.forEach(tag => {
            args.push(`-IPTC:Keywords+=${tag}`);
            args.push(`-XMP:Subject+=${tag}`);
          });
        }
      }

      args.push(jpgPath);

      // Log the complete exiftool command for debugging
      console.log(`[SmartFrame Canvas] Running exiftool command:`, 'exiftool', args.join(' '));
      console.log(`[SmartFrame Canvas] Embedding EXIF metadata...`);
      
      const exiftool = spawn('exiftool', args);
      
      let stdout = '';
      let stderr = '';
      
      exiftool.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      exiftool.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      exiftool.on('close', (code) => {
        if (code === 0) {
          console.log(`[SmartFrame Canvas] ✅ EXIF metadata embedded successfully`);
          if (stdout) console.log(`[SmartFrame Canvas] exiftool output: ${stdout.trim()}`);
          resolve();
        } else {
          console.error(`[SmartFrame Canvas] ⚠️  exiftool failed with code ${code}`);
          if (stderr) console.error(`[SmartFrame Canvas] stderr: ${stderr.trim()}`);
          if (stdout) console.error(`[SmartFrame Canvas] stdout: ${stdout.trim()}`);
          // Don't reject - we still have the image, just without EXIF
          resolve();
        }
      });
      
      exiftool.on('error', (error) => {
        console.error(`[SmartFrame Canvas] ⚠️  exiftool spawn error:`, error.message);
        // Don't reject - we still have the image, just without EXIF
        resolve();
      });
    });
  }
  /**
   * Extract canvas image from SmartFrame embed
   * @param page - Puppeteer page instance
   * @param imageId - SmartFrame image ID
   * @param outputDir - Directory to save extracted images
   * @param viewportMode - Viewport mode: "full" (9999x9999) or "thumbnail" (600x600)
   * @returns Path to extracted image file, or null if extraction failed
   */
  /**
   * Setup shadow root capture hook on a page BEFORE navigation
   * This must be called before navigating to ensure attachShadow is intercepted
   */
  async setupShadowRootCapture(page: Page, imageId: string, viewportMode: 'full' | 'thumbnail' = 'thumbnail'): Promise<void> {
    const smartframeEmbedSelector = `smartframe-embed[image-id="${imageId}"]`;
    const initScript = `
      window.__SMARTFRAME_EMBED_SELECTOR = ${JSON.stringify(smartframeEmbedSelector)};
      window.__SMARTFRAME_TARGET_IMAGE_ID = ${JSON.stringify(imageId)};
      window.__SMARTFRAME_VIEWPORT_MODE = ${JSON.stringify(viewportMode)};
    `;
    
    // CRITICAL: Use evaluateOnNewDocument to inject BEFORE page loads
    // This ensures the attachShadow hook is in place when SmartFrame initializes
    await page.evaluateOnNewDocument(initScript);
    await page.evaluateOnNewDocument(INJECTED_JAVASCRIPT);
    console.log(`[SmartFrame Canvas] Shadow root capture hook registered for ${viewportMode} mode`);
  }

  async extractCanvasImage(
    page: Page,
    imageId: string,
    outputDir: string,
    viewportMode: 'full' | 'thumbnail' = 'thumbnail',
    metadata?: ImageMetadata
  ): Promise<string | null> {
    console.log(`[SmartFrame Canvas] Extracting canvas image for ${imageId} in ${viewportMode} mode`);

    try {
      // TASK 2: Bring tab to front to ensure GPU rendering is active
      await page.bringToFront();
      console.log('[SmartFrame Canvas] Tab brought to front for GPU rendering');

      // TASK 2: Initial wait after page load for canvas rendering
      const initialWaitMs = this.config?.smartframe?.initialRenderWaitMs || 19000;
      console.log(`[SmartFrame Canvas] Waiting ${initialWaitMs}ms for initial canvas render...`);
      await this.wait(initialWaitMs);

      // TASK 2: Optional interaction to keep canvas "hot"
      // Simulate mouse movement over the canvas area
      try {
        await page.mouse.move(500, 500);
        await page.mouse.move(600, 600);
        console.log('[SmartFrame Canvas] Simulated mouse interaction to keep canvas active');
      } catch (error) {
        console.log('[SmartFrame Canvas] Mouse interaction skipped (optional)');
      }

      // TASK 2: Post-resize wait (if viewport was resized before this call)
      const postResizeWaitMs = this.config?.smartframe?.postResizeWaitMs || 10000;
      console.log(`[SmartFrame Canvas] Waiting ${postResizeWaitMs}ms after viewport setup...`);
      await this.wait(postResizeWaitMs);

      console.log('[SmartFrame Canvas] Waiting for canvas extraction to complete...');

      // Wait for the extension response
      const responseSelector = '#extension-response-data';
      await page.waitForSelector(
        `${responseSelector}[data-url], ${responseSelector}[data-error]`,
        { timeout: 120000 } // 2 minutes timeout for large canvas rendering
      );

      // Get the data URL or error
      const imageDataUrl = await page.$eval(
        responseSelector,
        (el) => el.getAttribute('data-url')
      );
      const errorFromExtension = await page.$eval(
        responseSelector,
        (el) => el.getAttribute('data-error')
      );

      if (errorFromExtension) {
        console.error(`[SmartFrame Canvas] Extension error: ${errorFromExtension}`);
        return null;
      }

      if (!imageDataUrl || !imageDataUrl.startsWith('data:image/png;base64,')) {
        console.error('[SmartFrame Canvas] No valid canvas data URL received');
        return null;
      }

      // Extract base64 data
      const base64Data = imageDataUrl.split(',')[1];
      const imageBuffer = Buffer.from(base64Data, 'base64');

      // Save as PNG (temporary intermediate file)
      const sanitizedId = imageId.replace(/[^a-zA-Z0-9.\-_]/g, '-');
      const pngFilename = `${sanitizedId}_canvas_${viewportMode}.png`;
      const pngPath = path.join(outputDir, pngFilename);

      fs.writeFileSync(pngPath, imageBuffer);
      console.log(`[SmartFrame Canvas] Saved intermediate PNG: ${pngPath}`);

      // TASK 3: Convert PNG to JPG using sharp
      const jpgQuality = viewportMode === 'full' 
        ? (this.config?.smartframe?.jpgQuality?.full || 95)
        : (this.config?.smartframe?.jpgQuality?.thumbnail || 80);
      
      const jpgFilename = `${sanitizedId}_canvas_${viewportMode}.jpg`;
      const jpgPath = path.join(outputDir, jpgFilename);

      console.log(`[SmartFrame Canvas] Converting PNG to JPG (quality: ${jpgQuality})...`);
      await sharp(imageBuffer)
        .jpeg({ quality: jpgQuality })
        .toFile(jpgPath);

      // Delete intermediate PNG file after successful JPG creation
      fs.unlinkSync(pngPath);
      console.log(`[SmartFrame Canvas] Deleted intermediate PNG file: ${pngFilename}`);
      console.log(`[SmartFrame Canvas] Saved JPG image: ${jpgPath}`);

      // TASK 4: File Validation
      const minFileSize = this.config?.smartframe?.minValidFileSize || 51200;
      const minDimensions = this.config?.smartframe?.minValidDimensions || 500;

      // Validate file size
      const fileStats = fs.statSync(jpgPath);
      const fileSizeBytes = fileStats.size;
      console.log(`[SmartFrame Canvas] Validating file size: ${fileSizeBytes} bytes (minimum: ${minFileSize} bytes)`);

      if (fileSizeBytes < minFileSize) {
        console.error(`[SmartFrame Canvas] ❌ VALIDATION FAILED: File size ${fileSizeBytes} bytes is below minimum ${minFileSize} bytes`);
        fs.unlinkSync(jpgPath);
        console.log(`[SmartFrame Canvas] Deleted invalid file: ${jpgFilename}`);
        return null;
      }

      // Validate image dimensions
      const imageInfo = await sharp(jpgPath).metadata();
      const width = imageInfo.width || 0;
      const height = imageInfo.height || 0;
      console.log(`[SmartFrame Canvas] Validating dimensions: ${width}x${height} (minimum: ${minDimensions}px)`);

      if (width < minDimensions || height < minDimensions) {
        console.error(`[SmartFrame Canvas] ❌ VALIDATION FAILED: Dimensions ${width}x${height} are below minimum ${minDimensions}px`);
        fs.unlinkSync(jpgPath);
        console.log(`[SmartFrame Canvas] Deleted invalid file: ${jpgFilename}`);
        return null;
      }

      // Validation passed
      console.log(`[SmartFrame Canvas] ✅ VALIDATION PASSED: File size ${fileSizeBytes} bytes, dimensions ${width}x${height}`);
      console.log(`[SmartFrame Canvas] Successfully extracted and validated canvas image: ${jpgFilename}`);

      // TASK 3: Embed EXIF metadata if provided
      if (metadata) {
        await this.embedExifMetadata(jpgPath, metadata);
      } else {
        console.log(`[SmartFrame Canvas] No metadata provided, skipping EXIF embedding`);
      }

      return jpgPath;
    } catch (error) {
      console.error(`[SmartFrame Canvas] Error extracting canvas:`, error);
      return null;
    }
  }

  /**
   * Convert PNG to JPG (optional, for compatibility)
   * Note: This would require an image processing library like sharp
   * For now, we'll just return the PNG path
   */
  async convertToJpg(pngPath: string): Promise<string | null> {
    // TODO: Implement PNG to JPG conversion using sharp or similar library
    // For now, return the PNG path as-is
    console.log('[SmartFrame Canvas] PNG to JPG conversion not yet implemented, returning PNG');
    return pngPath;
  }
}
