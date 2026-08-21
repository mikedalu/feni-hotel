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

    public byte[] generateEnterpriseInvoicePdf(String documentTitle, String invoiceNumber, String dateOfIssue,
                                               String guestDetails, String[] tableHeaders, List<String[]> tableRows,
                                               String subtotal, String total, String paymentMethod) {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4);
            PdfWriter.getInstance(document, out);
            document.open();

            // Header Layout using invisible table
            PdfPTable headerTable = new PdfPTable(2);
            headerTable.setWidthPercentage(100);
            headerTable.setWidths(new float[]{1f, 1f});

            // Left side (Title, Invoice Number, Date)
            PdfPCell leftCell = new PdfPCell();
            leftCell.setBorder(PdfPCell.NO_BORDER);
            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 22);
            leftCell.addElement(new Paragraph(documentTitle, titleFont));
            leftCell.addElement(new Paragraph(" "));
            Font labelFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10);
            Font valueFont = FontFactory.getFont(FontFactory.HELVETICA, 10);
            
            Paragraph invNumPara = new Paragraph();
            invNumPara.add(new Phrase("Invoice Number: ", labelFont));
            invNumPara.add(new Phrase(invoiceNumber, valueFont));
            leftCell.addElement(invNumPara);
            
            Paragraph datePara = new Paragraph();
            datePara.add(new Phrase("Date of Issue: ", labelFont));
            datePara.add(new Phrase(dateOfIssue, valueFont));
            leftCell.addElement(datePara);
            
            headerTable.addCell(leftCell);

            // Right side (Logo & Company Info)
            PdfPCell rightCell = new PdfPCell();
            rightCell.setBorder(PdfPCell.NO_BORDER);
            rightCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
            
            try {
                URL logoUrl = getClass().getResource("/logo.png");
                if (logoUrl != null) {
                    Image logo = Image.getInstance(logoUrl);
                    logo.scaleToFit(100, 100);
                    logo.setAlignment(Element.ALIGN_RIGHT);
                    rightCell.addElement(logo);
                }
            } catch (Exception e) {
                // Ignore missing logo
            }
            
            Font companyFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14);
            Paragraph companyName = new Paragraph("FENI HOTEL", companyFont);
            companyName.setAlignment(Element.ALIGN_RIGHT);
            rightCell.addElement(companyName);
            
            Font contactFont = FontFactory.getFont(FontFactory.HELVETICA, 9, java.awt.Color.DARK_GRAY);
            Paragraph contactInfo = new Paragraph("No. 1, Keana Link Road, Opposite NTA\nJos, Plateau State\n+234 123 456 7890 | contact@fenihotel.com", contactFont);
            contactInfo.setAlignment(Element.ALIGN_RIGHT);
            rightCell.addElement(contactInfo);
            
            headerTable.addCell(rightCell);
            document.add(headerTable);
            document.add(new Paragraph("\n\n"));

            // Bill To Section
            if (guestDetails != null && !guestDetails.trim().isEmpty()) {
                PdfPTable billToTable = new PdfPTable(1);
                billToTable.setWidthPercentage(100);
                PdfPCell billToCell = new PdfPCell();
                billToCell.setBorder(PdfPCell.NO_BORDER);
                billToCell.addElement(new Paragraph("BILLED TO:", labelFont));
                Paragraph guestPara = new Paragraph(guestDetails, valueFont);
                billToCell.addElement(guestPara);
                billToTable.addCell(billToCell);
                document.add(billToTable);
                document.add(new Paragraph("\n\n"));
            }

            // Line Items Table
            PdfPTable itemsTable = new PdfPTable(tableHeaders.length);
            itemsTable.setWidthPercentage(100);
            
            float[] columnWidths = new float[tableHeaders.length];
            columnWidths[0] = 0.5f; // S/N is small
            for(int i=1; i<tableHeaders.length; i++) {
                if(i == tableHeaders.length - 1 || i == tableHeaders.length - 2) {
                    columnWidths[i] = 1.2f; // amounts
                } else {
                    columnWidths[i] = 2f; // description
                }
            }
            itemsTable.setWidths(columnWidths);

            // Table Headers
            for (String header : tableHeaders) {
                PdfPCell cell = new PdfPCell(new Phrase(header, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, java.awt.Color.WHITE)));
                cell.setBackgroundColor(new java.awt.Color(50, 50, 50));
                cell.setPadding(8f);
                cell.setHorizontalAlignment(Element.ALIGN_CENTER);
                itemsTable.addCell(cell);
            }

            // Table Rows
            boolean alternateRow = false;
            for (String[] row : tableRows) {
                for (int i = 0; i < row.length; i++) {
                    PdfPCell cell = new PdfPCell(new Phrase(row[i] != null ? row[i] : "", valueFont));
                    cell.setPadding(8f);
                    if (alternateRow) {
                        cell.setBackgroundColor(new java.awt.Color(245, 245, 245));
                    }
                    if (i == 0) cell.setHorizontalAlignment(Element.ALIGN_CENTER);
                    else if (i == row.length - 1 || i == row.length - 2) cell.setHorizontalAlignment(Element.ALIGN_RIGHT);
                    else cell.setHorizontalAlignment(Element.ALIGN_LEFT);
                    
                    cell.setBorderColor(new java.awt.Color(200, 200, 200));
                    itemsTable.addCell(cell);
                }
                alternateRow = !alternateRow;
            }
            document.add(itemsTable);
            document.add(new Paragraph("\n"));

            // Totals Section
            PdfPTable totalsTable = new PdfPTable(2);
            totalsTable.setWidthPercentage(100);
            totalsTable.setWidths(new float[]{2.5f, 1f});
            
            // Left spacer
            PdfPCell spacerCell = new PdfPCell();
            spacerCell.setBorder(PdfPCell.NO_BORDER);
            totalsTable.addCell(spacerCell);
            
            // Right Totals grid
            PdfPTable rightTotalsGrid = new PdfPTable(2);
            rightTotalsGrid.setWidthPercentage(100);
            rightTotalsGrid.setWidths(new float[]{1f, 1f});
            
            PdfPCell subLbl = new PdfPCell(new Phrase("Subtotal:", labelFont));
            subLbl.setBorder(PdfPCell.NO_BORDER); subLbl.setHorizontalAlignment(Element.ALIGN_RIGHT); subLbl.setPaddingBottom(5f);
            PdfPCell subVal = new PdfPCell(new Phrase(subtotal, valueFont));
            subVal.setBorder(PdfPCell.NO_BORDER); subVal.setHorizontalAlignment(Element.ALIGN_RIGHT); subVal.setPaddingBottom(5f);
            rightTotalsGrid.addCell(subLbl); rightTotalsGrid.addCell(subVal);
            
            PdfPCell taxLbl = new PdfPCell(new Phrase("Tax:", labelFont));
            taxLbl.setBorder(PdfPCell.NO_BORDER); taxLbl.setHorizontalAlignment(Element.ALIGN_RIGHT); taxLbl.setPaddingBottom(5f);
            PdfPCell taxVal = new PdfPCell(new Phrase("$0.00", valueFont));
            taxVal.setBorder(PdfPCell.NO_BORDER); taxVal.setHorizontalAlignment(Element.ALIGN_RIGHT); taxVal.setPaddingBottom(5f);
            rightTotalsGrid.addCell(taxLbl); rightTotalsGrid.addCell(taxVal);
            
            PdfPCell totLbl = new PdfPCell(new Phrase("TOTAL:", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12)));
            totLbl.setBorder(PdfPCell.TOP); totLbl.setBorderColor(java.awt.Color.GRAY); totLbl.setHorizontalAlignment(Element.ALIGN_RIGHT); totLbl.setPaddingTop(5f);
            PdfPCell totVal = new PdfPCell(new Phrase(total, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12)));
            totVal.setBorder(PdfPCell.TOP); totVal.setBorderColor(java.awt.Color.GRAY); totVal.setHorizontalAlignment(Element.ALIGN_RIGHT); totVal.setPaddingTop(5f);
            rightTotalsGrid.addCell(totLbl); rightTotalsGrid.addCell(totVal);
            
            if (paymentMethod != null && !paymentMethod.isEmpty()) {
                PdfPCell payLbl = new PdfPCell(new Phrase("Payment Method:", labelFont));
                payLbl.setBorder(PdfPCell.NO_BORDER); payLbl.setHorizontalAlignment(Element.ALIGN_RIGHT); payLbl.setPaddingTop(5f);
                PdfPCell payVal = new PdfPCell(new Phrase(paymentMethod, valueFont));
                payVal.setBorder(PdfPCell.NO_BORDER); payVal.setHorizontalAlignment(Element.ALIGN_RIGHT); payVal.setPaddingTop(5f);
                rightTotalsGrid.addCell(payLbl); rightTotalsGrid.addCell(payVal);
            }
            
            PdfPCell rightTotalsCell = new PdfPCell(rightTotalsGrid);
            rightTotalsCell.setBorder(PdfPCell.NO_BORDER);
            totalsTable.addCell(rightTotalsCell);
            
            document.add(totalsTable);

            // Footer
            document.add(new Paragraph("\n\n\n"));
            Paragraph footer = new Paragraph("Thank you for your business. We hope to see you again!", FontFactory.getFont(FontFactory.HELVETICA_OBLIQUE, 10, java.awt.Color.DARK_GRAY));
            footer.setAlignment(Element.ALIGN_CENTER);
            document.add(footer);

            document.close();
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate Enterprise PDF", e);
        }
    }
}
