package com.college.placement.controller;

import com.college.placement.model.Company;
import com.college.placement.service.CompanyService;
import com.college.placement.service.PlacementService;
import jakarta.validation.Valid;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class CompanyController {

    private final CompanyService companyService;
    private final PlacementService placementService;

    public CompanyController(CompanyService companyService, PlacementService placementService) {
        this.companyService = companyService;
        this.placementService = placementService;
    }

    @GetMapping("/companies")
    public Page<Company> listCompanies(
            @RequestParam(defaultValue = "") String name,
            @RequestParam(required = false) Double minCgpa,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sort,
            @RequestParam(defaultValue = "asc") String dir
    ) {
        Sort sortObj = dir.equalsIgnoreCase("desc") ? Sort.by(sort).descending() : Sort.by(sort).ascending();
        return companyService.findCompanies(name, minCgpa, PageRequest.of(page, size, sortObj));
    }

    @PostMapping("/companies/add")
    public Company addCompany(@Valid @RequestBody Company company) {
        return companyService.saveCompany(company);
    }

    @PutMapping("/companies/{id}")
    public ResponseEntity<Company> updateCompany(@PathVariable Long id, @Valid @RequestBody Company company) {
        Company updated = companyService.updateCompany(id, company);
        if (updated == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(updated);
    }

    @GetMapping("/companies/{id}/eligible-students")
    public ResponseEntity<List<com.college.placement.model.Student>> eligibleStudents(@PathVariable Long id) {
        Company company = companyService.getCompanyById(id);
        if (company == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(placementService.eligibleStudentsForCompany(company));
    }

    @GetMapping("/companies/export/csv")
    public ResponseEntity<String> exportCompaniesCsv(
            @RequestParam(defaultValue = "") String name,
            @RequestParam(required = false) Double minCgpa
    ) {
        List<Company> rows = companyService.findCompanies(name, minCgpa, PageRequest.of(0, Integer.MAX_VALUE)).getContent();
        StringBuilder sb = new StringBuilder();
        sb.append("ID,Name,Role,MinCGPA,EligibleBranches,MaxBacklogs").append('\n');
        for (Company c : rows) {
            sb.append(c.getId()).append(',')
              .append(csv(c.getName())).append(',')
              .append(csv(c.getRole())).append(',')
              .append(c.getMinCgpa()).append(',')
              .append(csv(c.getEligibleBranches() != null ? c.getEligibleBranches() : ""))
              .append(',').append(c.getMaxBacklogs())
              .append('\n');
        }
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=companies.csv")
                .contentType(MediaType.TEXT_PLAIN)
                .body(sb.toString());
    }

    @GetMapping("/companies/export/excel")
    public ResponseEntity<byte[]> exportCompaniesExcel(
            @RequestParam(defaultValue = "") String name,
            @RequestParam(required = false) Double minCgpa
    ) throws Exception {
        List<Company> rows = companyService.findCompanies(name, minCgpa, PageRequest.of(0, Integer.MAX_VALUE)).getContent();
        Workbook workbook = new XSSFWorkbook();
        Sheet sheet = workbook.createSheet("Companies");
        int r = 0;
        Row header = sheet.createRow(r++);
        header.createCell(0).setCellValue("ID");
        header.createCell(1).setCellValue("Name");
        header.createCell(2).setCellValue("Role");
        header.createCell(3).setCellValue("Min CGPA");
        header.createCell(4).setCellValue("Eligible Branches");
        header.createCell(5).setCellValue("Max Backlogs");
        for (Company c : rows) {
            Row row = sheet.createRow(r++);
            row.createCell(0).setCellValue(c.getId());
            row.createCell(1).setCellValue(c.getName());
            row.createCell(2).setCellValue(c.getRole());
            row.createCell(3).setCellValue(c.getMinCgpa());
            row.createCell(4).setCellValue(c.getEligibleBranches() != null ? c.getEligibleBranches() : "");
            row.createCell(5).setCellValue(c.getMaxBacklogs());
        }
        for (int i = 0; i < 6; i++) {
            sheet.autoSizeColumn(i);
        }
        byte[] bytes;
        try (java.io.ByteArrayOutputStream out = new java.io.ByteArrayOutputStream()) {
            workbook.write(out);
            bytes = out.toByteArray();
        }
        workbook.close();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=companies.xlsx")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(bytes);
    }

    private String csv(String value) {
        if (value == null) return "";
        String escaped = value.replace("\"", "\"\"");
        return "\"" + escaped + "\"";
    }
}
