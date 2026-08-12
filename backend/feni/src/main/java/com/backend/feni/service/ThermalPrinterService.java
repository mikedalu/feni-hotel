package com.backend.feni.service;

import com.backend.feni.entity.Product;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.io.OutputStream;
import java.net.Socket;

@Service
@Slf4j
public class ThermalPrinterService {

    @Async
    public void printReceiptAsync(String receiptContent, String printerIp) {
        log.info("Printing receipt asynchronously to {}", printerIp);
        try (Socket socket = new Socket(printerIp, 9100)) {
            socket.setSoTimeout(3000);
            OutputStream out = socket.getOutputStream();
            out.write(receiptContent.getBytes());
            out.flush();
        } catch (Exception e) {
            log.error("Failed to print receipt to {}", printerIp, e);
            // Exception is caught and not rethrown so it doesn't break transaction if called inside one (though it's async)
        }
    }

    @Async
    public void printInventoryLabelsAsync(Product product, int quantity, String printerIp) {
        log.info("Printing {} inventory labels for {} to {}", quantity, product.getName(), printerIp);
        try (Socket socket = new Socket(printerIp, 9100)) {
            socket.setSoTimeout(3000);
            OutputStream out = socket.getOutputStream();
            
            // Generate basic ZPL for the label
            String zpl = String.format("^XA^FO50,50^A0N,50,50^FD%s^FS^FO50,120^BCN,100,Y,N,N^FD%s^FS^XZ", 
                    product.getName(), product.getInternalSku());
            
            for (int i = 0; i < quantity; i++) {
                out.write(zpl.getBytes());
            }
            out.flush();
        } catch (Exception e) {
            log.error("Failed to print labels to {}", printerIp, e);
        }
    }
}
