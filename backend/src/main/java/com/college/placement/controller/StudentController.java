package com.college.placement.controller;

import com.college.placement.model.Student;
import com.college.placement.service.StudentService;
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
public class StudentController {

    private final StudentService studentService;

    public StudentController(StudentService studentService) {
        this.studentService = studentService;
    }

    @GetMapping("/students")
    public Page<Student> listStudents(
            @RequestParam(defaultValue = "") String name,
            @RequestParam(defaultValue = "") String branch,
            @RequestParam(defaultValue = "all") String placed,
            @RequestParam(required = false) Double cgpaMin,
            @RequestParam(required = false) Double cgpaMax,
            @RequestParam(defaultValue = "") String companyName,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sort,
            @RequestParam(defaultValue = "asc") String dir
    ) {
        Sort sortObj = dir.equalsIgnoreCase("desc") ? Sort.by(sort).descending() : Sort.by(sort).ascending();
        return studentService.findStudents(name, branch, placed, cgpaMin, cgpaMax, companyName, PageRequest.of(page, size, sortObj));
    }

    @PostMapping("/students/add")
    public Student addStudent(@Valid @RequestBody Student student) {
        return studentService.saveStudent(student);
    }

    @GetMapping("/students/delete/{id}")
    public ResponseEntity<Void> deleteStudent(@PathVariable Long id) {
        studentService.deleteStudent(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/students/{id}")
    public ResponseEntity<Student> updateStudent(@PathVariable Long id, @Valid @RequestBody Student student) {
        Student updated = studentService.updateStudent(id, student);
        if (updated == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(updated);
    }

    @GetMapping("/students/export/csv")
    public ResponseEntity<String> exportStudentsCsv(
            @RequestParam(defaultValue = "") String name,
            @RequestParam(defaultValue = "") String branch,
            @RequestParam(defaultValue = "all") String placed,
            @RequestParam(required = false) Double cgpaMin,
            @RequestParam(required = false) Double cgpaMax,
            @RequestParam(defaultValue = "") String companyName
    ) {
        List<Student> rows = studentService.findStudents(name, branch, placed, cgpaMin, cgpaMax, companyName, PageRequest.of(0, Integer.MAX_VALUE)).getContent();
        StringBuilder sb = new StringBuilder();
        sb.append("ID,Name,Email,Branch,CGPA,Backlogs,Placed,Company").append('\n');
        for (Student s : rows) {
            sb.append(s.getId()).append(',')
              .append(csv(s.getName())).append(',')
              .append(csv(s.getEmail())).append(',')
              .append(csv(s.getBranch())).append(',')
              .append(s.getCgpa()).append(',')
              .append(s.getBacklogs()).append(',')
              .append(s.isPlaced()).append(',')
              .append(csv(s.getCompany() != null ? s.getCompany().getName() : ""))
              .append('\n');
        }
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=students.csv")
                .contentType(MediaType.TEXT_PLAIN)
                .body(sb.toString());
    }

    @GetMapping("/students/export/excel")
    public ResponseEntity<byte[]> exportStudentsExcel(
            @RequestParam(defaultValue = "") String name,
            @RequestParam(defaultValue = "") String branch,
            @RequestParam(defaultValue = "all") String placed,
            @RequestParam(required = false) Double cgpaMin,
            @RequestParam(required = false) Double cgpaMax,
            @RequestParam(defaultValue = "") String companyName
    ) throws Exception {
        List<Student> rows = studentService.findStudents(name, branch, placed, cgpaMin, cgpaMax, companyName, PageRequest.of(0, Integer.MAX_VALUE)).getContent();
        Workbook workbook = new XSSFWorkbook();
        Sheet sheet = workbook.createSheet("Students");
        int r = 0;
        Row header = sheet.createRow(r++);
        header.createCell(0).setCellValue("ID");
        header.createCell(1).setCellValue("Name");
        header.createCell(2).setCellValue("Email");
        header.createCell(3).setCellValue("Branch");
        header.createCell(4).setCellValue("CGPA");
        header.createCell(5).setCellValue("Backlogs");
        header.createCell(6).setCellValue("Placed");
        header.createCell(7).setCellValue("Company");
        for (Student s : rows) {
            Row row = sheet.createRow(r++);
            row.createCell(0).setCellValue(s.getId());
            row.createCell(1).setCellValue(s.getName());
            row.createCell(2).setCellValue(s.getEmail());
            row.createCell(3).setCellValue(s.getBranch());
            row.createCell(4).setCellValue(s.getCgpa());
            row.createCell(5).setCellValue(s.getBacklogs());
            row.createCell(6).setCellValue(s.isPlaced());
            row.createCell(7).setCellValue(s.getCompany() != null ? s.getCompany().getName() : "");
        }
        for (int i = 0; i < 8; i++) {
            sheet.autoSizeColumn(i);
        }
        byte[] bytes;
        try (java.io.ByteArrayOutputStream out = new java.io.ByteArrayOutputStream()) {
            workbook.write(out);
            bytes = out.toByteArray();
        }
        workbook.close();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=students.xlsx")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(bytes);
    }

    private String csv(String value) {
        if (value == null) return "";
        String escaped = value.replace("\"", "\"\"");
        return "\"" + escaped + "\"";
    }
}
