package com.college.placement.service;

import com.college.placement.model.Company;
import com.college.placement.model.Placement;
import com.college.placement.model.Student;
import com.college.placement.repository.CompanyRepository;
import com.college.placement.repository.NotificationRepository;
import com.college.placement.repository.PlacementRepository;
import com.college.placement.repository.PredictionRepository;
import com.college.placement.repository.ResumeRepository;
import com.college.placement.repository.StudentRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

@Service
public class SeedService {

    private final StudentRepository studentRepository;
    private final CompanyRepository companyRepository;
    private final PlacementRepository placementRepository;
    private final NotificationRepository notificationRepository;
    private final ResumeRepository resumeRepository;
    private final PredictionRepository predictionRepository;

    private final boolean refreshEnabled;
    private final int studentCount;
    private final int companyCount;

    private final Random random = new Random();
    private volatile long lastRefreshEpochMs = 0;

    private static final String[] FIRST_NAMES = {
            "Aarav", "Isha", "Rohit", "Ananya", "Vikram", "Priya", "Arjun", "Meera", "Kiran", "Neha",
            "Rahul", "Sanya", "Aditi", "Kabir", "Nisha", "Ravi", "Pooja", "Siddharth", "Kavya", "Aditya"
    };

    private static final String[] LAST_NAMES = {
            "Sharma", "Verma", "Reddy", "Nair", "Gupta", "Iyer", "Das", "Singh", "Patel", "Mehta",
            "Kumar", "Rao", "Joshi", "Bose", "Chaudhary", "Kapoor", "Ahuja", "Bhat", "Mishra", "Saxena"
    };

    private static final String[] BRANCHES = {"CSE", "ECE", "IT", "ME", "EEE", "CIVIL"};
    private static final String[] COMPANY_PREFIX = {"Alpha", "Nova", "Nimbus", "Vertex", "Zenith", "Pioneer", "Orion", "Apex", "Omni", "Quest"};
    private static final String[] COMPANY_SUFFIX = {"Tech", "Systems", "Labs", "Solutions", "Soft", "Digital", "Networks", "Dynamics", "Works", "Logic"};
    private static final String[] ROLES = {"Software Engineer", "Data Analyst", "Backend Engineer", "Frontend Engineer", "QA Engineer", "DevOps Engineer"};

    public SeedService(StudentRepository studentRepository,
                       CompanyRepository companyRepository,
                       PlacementRepository placementRepository,
                       NotificationRepository notificationRepository,
                       ResumeRepository resumeRepository,
                       PredictionRepository predictionRepository,
                       @Value("${seed.refresh.enabled:true}") boolean refreshEnabled,
                       @Value("${seed.data.students:500}") int studentCount,
                       @Value("${seed.data.companies:80}") int companyCount) {
        this.studentRepository = studentRepository;
        this.companyRepository = companyRepository;
        this.placementRepository = placementRepository;
        this.notificationRepository = notificationRepository;
        this.resumeRepository = resumeRepository;
        this.predictionRepository = predictionRepository;
        this.refreshEnabled = refreshEnabled;
        this.studentCount = studentCount;
        this.companyCount = companyCount;
    }

    @Scheduled(fixedRateString = "${seed.refresh.fixed-rate-ms:3600000}", initialDelayString = "1000")
    @Transactional
    public void refreshDataset() {
        if (!refreshEnabled) {
            return;
        }

        placementRepository.deleteAll();
        resumeRepository.deleteAll();
        predictionRepository.deleteAll();
        notificationRepository.deleteAll();
        studentRepository.deleteAll();
        companyRepository.deleteAll();

        List<Company> companies = new ArrayList<>();
        for (int i = 0; i < companyCount; i++) {
            Company c = new Company();
            c.setName(COMPANY_PREFIX[i % COMPANY_PREFIX.length] + " " + COMPANY_SUFFIX[i % COMPANY_SUFFIX.length] + " " + (i + 1));
            c.setRole(ROLES[i % ROLES.length]);
            c.setMinCgpa(6.0 + (random.nextInt(30) / 10.0));
            c.setMaxBacklogs(random.nextInt(3));
            c.setEligibleBranches(buildEligibleBranches());
            companies.add(c);
        }
        companyRepository.saveAll(companies);

        List<Student> students = new ArrayList<>();
        for (int i = 0; i < studentCount; i++) {
            Student s = new Student();
            String first = FIRST_NAMES[random.nextInt(FIRST_NAMES.length)];
            String last = LAST_NAMES[random.nextInt(LAST_NAMES.length)];
            s.setName(first + " " + last);
            s.setEmail((first + "." + last + (100 + i) + "@example.com").toLowerCase());
            s.setBranch(BRANCHES[i % BRANCHES.length]);
            s.setCgpa(5.5 + (random.nextInt(40) / 10.0));
            s.setBacklogs(random.nextInt(3));
            s.setPlaced(false);
            double score = Math.min(99.0, Math.max(5.0, (s.getCgpa() / 10.0) * 100.0 - (s.getBacklogs() * 5)));
            s.setPlacementScore(score);
            s.setTag(score >= 80 ? "High Potential" : (score >= 50 ? "Medium Potential" : "Needs Improvement"));
            students.add(s);
        }
        studentRepository.saveAll(students);

        List<Placement> placements = new ArrayList<>();
        for (Student s : students) {
            if (s.getCgpa() >= 7.0 && random.nextDouble() > 0.4) {
                Company c = companies.get(random.nextInt(companies.size()));
                s.setPlaced(true);
                s.setCompany(c);

                Placement p = new Placement();
                p.setStudent(s);
                p.setCompany(c);
                p.setOfferStatus(com.college.placement.model.OfferStatus.OFFERED);
                p.setPackageAmount(4.0 + random.nextInt(10));
                p.setPlacementDate(LocalDate.now().minusDays(random.nextInt(30)));
                placements.add(p);
            }
        }
        studentRepository.saveAll(students);
        placementRepository.saveAll(placements);

        lastRefreshEpochMs = System.currentTimeMillis();
    }

    public long getLastRefreshEpochMs() {
        return lastRefreshEpochMs;
    }

    private String buildEligibleBranches() {
        int count = 2 + random.nextInt(3);
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < count; i++) {
            if (i > 0) sb.append(",");
            sb.append(BRANCHES[random.nextInt(BRANCHES.length)]);
        }
        return sb.toString();
    }
}
