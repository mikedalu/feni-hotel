package com.backend.feni.service;

import com.lowagie.text.Document;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.util.List;

@Service
public class PdfGenerationService {

    public byte[] generateSimpleTextPdf(String title, String content) {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document document = new Document();
            PdfWriter.getInstance(document, out);
            document.open();
            
            document.add(new Paragraph(title));
            document.add(new Paragraph(" "));
            document.add(new Paragraph(content));
            
            document.close();
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate PDF", e);
        }
    }

    public byte[] generateTablePdf(String title, String[] headers, List<String[]> rows) {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4.rotate());
            PdfWriter.getInstance(document, out);
            document.open();

            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 16);
            document.add(new Paragraph(title, titleFont));
            document.add(new Paragraph(" "));

            PdfPTable table = new PdfPTable(headers.length);
            table.setWidthPercentage(100);

            Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10);
            for (String header : headers) {
                PdfPCell cell = new PdfPCell(new Phrase(header, headerFont));
                table.addCell(cell);
            }

            Font rowFont = FontFactory.getFont(FontFactory.HELVETICA, 9);
            for (String[] row : rows) {
                for (String cellContent : row) {
                    table.addCell(new PdfPCell(new Phrase(cellContent != null ? cellContent : "", rowFont)));
                }
            }

            document.add(table);
            document.close();
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate PDF", e);
        }
    }
}
