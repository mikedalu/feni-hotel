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

import com.lowagie.text.Element;
import com.lowagie.text.Image;
import java.net.URL;

@Service
public class PdfGenerationService {

    private void addCompanyHeader(Document document) {
        try {
            URL logoUrl = getClass().getResource("/logo.png");
            if (logoUrl != null) {
                Image logo = Image.getInstance(logoUrl);
                logo.scaleToFit(80, 80);
                logo.setAlignment(Element.ALIGN_CENTER);
                document.add(logo);
            }
        } catch (Exception e) {
            // Logo not found or failed to load, proceed without it
        }

        Font companyFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18);
        Paragraph companyName = new Paragraph("FENI HOTEL", companyFont);
        companyName.setAlignment(Element.ALIGN_CENTER);
        document.add(companyName);

        Font contactFont = FontFactory.getFont(FontFactory.HELVETICA, 10);
        Paragraph contactInfo = new Paragraph("ADDRESS: No. 1, Keana Link Road, Opposite NTA, Jos, Plateau State\nPhone: +234 123 456 7890 | Email: contact@fenihotel.com", contactFont);
        contactInfo.setAlignment(Element.ALIGN_CENTER);
        document.add(contactInfo);
        
        document.add(new Paragraph(" "));
        Paragraph separator = new Paragraph("------------------------------------------------------------------");
        separator.setAlignment(Element.ALIGN_CENTER);
        document.add(separator);
        document.add(new Paragraph(" "));
    }

    public byte[] generateSimpleTextPdf(String title, String content) {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document document = new Document();
            PdfWriter.getInstance(document, out);
            document.open();
            
            addCompanyHeader(document);
            
            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 16);
            Paragraph titlePara = new Paragraph(title, titleFont);
            titlePara.setAlignment(Element.ALIGN_CENTER);
            document.add(titlePara);
            
            document.add(new Paragraph(" "));
            document.add(new Paragraph(content));
            
            document.close();
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate PDF", e);
        }
    }

    public byte[] generateTablePdf(String title, String[] headers, List<String[]> rows) {
        return generateTablePdf(title, headers, rows, null);
    }

    public byte[] generateTablePdf(String title, String[] headers, List<String[]> rows, String footerText) {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4.rotate());
            PdfWriter.getInstance(document, out);
            document.open();

            addCompanyHeader(document);

            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 16);
            Paragraph titlePara = new Paragraph(title, titleFont);
            titlePara.setAlignment(Element.ALIGN_CENTER);
            document.add(titlePara);
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
            
            if (footerText != null) {
                document.add(new Paragraph(" "));
                document.add(new Paragraph(" "));
                Font footerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12);
                Paragraph footerPara = new Paragraph(footerText, footerFont);
                document.add(footerPara);
            }
            
            document.close();
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate PDF", e);
        }
    }
}
