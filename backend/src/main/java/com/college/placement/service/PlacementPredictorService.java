package com.college.placement.service;

import com.college.placement.model.Prediction;
import com.college.placement.model.Student;
import com.college.placement.repository.PredictionRepository;
import com.college.placement.repository.StudentRepository;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class PlacementPredictorService {

    private final StudentRepository studentRepository;
    private final PredictionRepository predictionRepository;

    public PlacementPredictorService(StudentRepository studentRepository,
                                     PredictionRepository predictionRepository) {
        this.studentRepository = studentRepository;
        this.predictionRepository = predictionRepository;
    }

    public double predictProbability(Student target) {
        List<Student> all = studentRepository.findAll();
        if (all.size() < 10) {
            return baselineProbability(target);
        }

        Set<String> branches = new LinkedHashSet<>();
        for (Student s : all) {
            branches.add(s.getBranch());
        }
        List<String> branchList = new ArrayList<>(branches);

        int featureCount = 3 + branchList.size();
        double[] weights = new double[featureCount];
        double lr = 0.1;
        int epochs = 200;

        for (int epoch = 0; epoch < epochs; epoch++) {
            double[] grad = new double[featureCount];
            for (Student s : all) {
                double[] x = featureVector(s, branchList);
                double y = s.isPlaced() ? 1.0 : 0.0;
                double pred = sigmoid(dot(weights, x));
                for (int i = 0; i < featureCount; i++) {
                    grad[i] += (pred - y) * x[i];
                }
            }
            for (int i = 0; i < featureCount; i++) {
                weights[i] -= lr * grad[i] / all.size();
            }
        }

        double[] xTarget = featureVector(target, branchList);
        return sigmoid(dot(weights, xTarget));
    }

    public Prediction predictAndStore(Student target) {
        double prob = predictProbability(target) * 100.0;
        String tag = toTag(prob);

        target.setPlacementScore(prob);
        target.setTag(tag);
        studentRepository.save(target);

        Prediction prediction = new Prediction();
        prediction.setStudent(target);
        prediction.setProbability(prob);
        prediction.setTag(tag);
        return predictionRepository.save(prediction);
    }

    private double[] featureVector(Student s, List<String> branches) {
        double cgpa = s.getCgpa() == null ? 0 : s.getCgpa() / 10.0;
        double backlogs = s.getBacklogs() == null ? 0 : s.getBacklogs() / 10.0;
        double placedFlag = s.isPlaced() ? 1.0 : 0.0;
        double[] vec = new double[3 + branches.size()];
        vec[0] = 1.0; // bias
        vec[1] = cgpa;
        vec[2] = -backlogs;
        for (int i = 0; i < branches.size(); i++) {
            vec[3 + i] = branches.get(i).equalsIgnoreCase(s.getBranch()) ? 1.0 : 0.0;
        }
        return vec;
    }

    private double dot(double[] w, double[] x) {
        double sum = 0;
        for (int i = 0; i < w.length; i++) {
            sum += w[i] * x[i];
        }
        return sum;
    }

    private double sigmoid(double z) {
        return 1.0 / (1.0 + Math.exp(-z));
    }

    private double baselineProbability(Student s) {
        double cgpa = s.getCgpa() == null ? 0 : s.getCgpa() / 10.0;
        double backlogs = s.getBacklogs() == null ? 0 : s.getBacklogs() * 0.05;
        double p = Math.min(0.95, Math.max(0.05, 0.2 + (cgpa * 0.7) - backlogs));
        return p;
    }

    private String toTag(double probabilityPercent) {
        if (probabilityPercent >= 80) {
            return "High Potential";
        }
        if (probabilityPercent >= 50) {
            return "Medium Potential";
        }
        return "Needs Improvement";
    }
}
