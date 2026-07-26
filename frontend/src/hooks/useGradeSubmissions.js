import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, useNavigate } from "react-router";
import { toast } from "react-toastify";
import useAxiosSecure from "./useAxiosSecure";
import useAuth from "./useAuth";
import { parseFeedback } from "../utils/parseFeedback";
import { calculateIeltsBand } from "../utils/gradingUtils";

export const useGradeSubmissions = () => {
    const axiosSecure = useAxiosSecure();
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const location = useLocation();

    const [activeTab, setActiveTab] = useState("mock-tests"); // 'mock-tests' or 'skill-labs'

    /* --- Full Mock Test State --- */
    const [scores, setScores] = useState({});
    const [expandedMockResult, setExpandedMockResult] = useState(null);
    const [mockEvalDetail, setMockEvalDetail] = useState(null);
    const [mockReviewData, setMockReviewData] = useState({ 
        score: "", 
        feedback: "", 
        criteria: { ta: "", cc: "", fc: "", lr: "", gra: "", pr: "" },
        task1: { criteria: { ta: "", cc: "", lr: "", gra: "" }, feedback: "", bandScore: "" },
        task2: { criteria: { tr: "", cc: "", lr: "", gra: "" }, feedback: "", bandScore: "" },
        comments: ""
    });
    const [loadingEvalDetail, setLoadingEvalDetail] = useState(false);
    const [isEditingMockGrade, setIsEditingMockGrade] = useState(false);

    const { data: results = [], isLoading: loadingMock } = useQuery({
        queryKey: ["all-mock-results"],
        queryFn: async () => {
            const res = await axiosSecure.get("/mock-tests/results/all");
            return res.data.results ?? [];
        }
    });

    const gradeMutation = useMutation({
        mutationFn: (data) => axiosSecure.patch("/mock-tests/grade-section", data),
        onSuccess: () => {
            toast.success("Section graded successfully");
            queryClient.invalidateQueries({ queryKey: ["all-mock-results"] });
        }
    });

    const handleOpenMockEval = async (resultId, sectionType, isGraded) => {
        try {
            setLoadingEvalDetail(true);
            const { data } = await axiosSecure.get(`/mock-tests/results/${resultId}`);
            if (data.success) {
                const section = data.result.sectionResults.find(s => s.sectionType === sectionType);
                setMockEvalDetail({
                    resultId,
                    sectionType,
                    isGraded,
                    result: data.result,
                    section
                });
                const parsed = parseFeedback(section?.feedback);
                if (parsed.isTwoTasks) {
                    setMockReviewData({
                        score: section?.score?.toString() || "",
                        feedback: "",
                        comments: parsed.comments || "",
                        criteria: { ta: "", cc: "", fc: "", lr: "", gra: "", pr: "" },
                        task1: parsed.task1 || { criteria: { ta: "", cc: "", lr: "", gra: "" }, feedback: "", bandScore: "" },
                        task2: parsed.task2 || { criteria: { tr: "", cc: "", lr: "", gra: "" }, feedback: "", bandScore: "" }
                    });
                } else {
                    setMockReviewData({
                        score: section?.score?.toString() || "",
                        feedback: parsed.comments || section?.feedback || "",
                        comments: parsed.comments || section?.feedback || "",
                        criteria: parsed.criteria || { ta: "", cc: "", fc: "", lr: "", gra: "", pr: "" },
                        task1: { criteria: { ta: "", cc: "", lr: "", gra: "" }, feedback: "", bandScore: "" },
                        task2: { criteria: { tr: "", cc: "", lr: "", gra: "" }, feedback: "", bandScore: "" }
                    });
                }
                setIsEditingMockGrade(false);
            } else {
                toast.error("Failed to load submission details");
            }
        } catch (error) {
            toast.error("Error loading submission details");
        } finally {
            setLoadingEvalDetail(false);
        }
    };

    const handleMockReviewSubmit = async (e) => {
        e.preventDefault();
        
        if (mockEvalDetail.sectionType === 'writing') {
            const t1c = mockReviewData.task1.criteria || {};
            const t2c = mockReviewData.task2.criteria || {};
            const t1List = [t1c.ta, t1c.cc, t1c.lr, t1c.gra];
            const t2List = [t2c.tr, t2c.cc, t2c.lr, t2c.gra];
            
            if (t1List.some(s => s === "") || t2List.some(s => s === "")) {
                return toast.error("Please select all criteria for both Task 1 and Task 2");
            }
            
            const t1Band = calculateIeltsBand(t1List);
            const t2Band = calculateIeltsBand(t2List);
            const overallBand = calculateIeltsBand([t1Band, t2Band, t2Band]);
            
            const serializedFeedback = JSON.stringify({
                task1: {
                    criteria: t1c,
                    feedback: mockReviewData.task1.feedback,
                    bandScore: t1Band.toFixed(1)
                },
                task2: {
                    criteria: t2c,
                    feedback: mockReviewData.task2.feedback,
                    bandScore: t2Band.toFixed(1)
                },
                comments: mockReviewData.comments,
                overallBand: overallBand.toFixed(1)
            });
            
            setSubmitting(true);
            try {
                await gradeMutation.mutateAsync({
                    resultId: mockEvalDetail.resultId,
                    sectionType: 'writing',
                    score: overallBand,
                    feedback: serializedFeedback
                });
                setMockEvalDetail(null);
            } catch (err) {
                // error handled
            } finally {
                setSubmitting(false);
            }
            return;
        }

        const criteria = mockReviewData.criteria || {};
        const scoresList = [];
        if (mockEvalDetail.sectionType === 'writing') {
            scoresList.push(criteria.ta);
            scoresList.push(criteria.cc);
            scoresList.push(criteria.lr);
            scoresList.push(criteria.gra);
        } else {
            scoresList.push(criteria.fc);
            scoresList.push(criteria.lr);
            scoresList.push(criteria.gra);
            scoresList.push(criteria.pr);
        }

        if (scoresList.some(s => s === "" || s === undefined || s === null)) {
            return toast.error("Please rate all 4 evaluation criteria");
        }

        const calculatedOverallScore = calculateIeltsBand(scoresList);
        const serializedFeedback = JSON.stringify({
            criteria,
            comments: mockReviewData.feedback
        });

        setSubmitting(true);
        try {
            await gradeMutation.mutateAsync({
                resultId: mockEvalDetail.resultId,
                sectionType: mockEvalDetail.sectionType,
                score: calculatedOverallScore,
                feedback: serializedFeedback
            });
            setMockEvalDetail(null);
        } catch (error) {
            // handled
        } finally {
            setSubmitting(false);
        }
    };

    const handleGradeSubmit = (resultId, sectionType) => {
        const score = scores[`${resultId}-${sectionType}`];
        if (!score) return toast.error("Please enter a score");
        gradeMutation.mutate({ resultId, sectionType, score: parseFloat(score) });
    };

    /* --- Skill Labs State & Query --- */
    const [selectedSubmission, setSelectedSubmission] = useState(null);
    const [reviewData, setReviewData] = useState({ 
        score: "", 
        bandScore: "", 
        feedback: "",
        task1: { criteria: { ta: "", cc: "", lr: "", gra: "" }, feedback: "", bandScore: "" },
        task2: { criteria: { tr: "", cc: "", lr: "", gra: "" }, feedback: "", bandScore: "" },
        comments: ""
    });
    const [submitting, setSubmitting] = useState(false);
    const [filter, setFilter] = useState({ status: "pending", testType: "" });

    useEffect(() => {
        if (selectedSubmission) {
            const parsed = parseFeedback(selectedSubmission.feedback);
            if (parsed.isTwoTasks) {
                setReviewData({
                    score: selectedSubmission.score?.toString() || "",
                    bandScore: selectedSubmission.bandScore || "",
                    feedback: "",
                    comments: parsed.comments || "",
                    task1: parsed.task1 || { criteria: { ta: "", cc: "", lr: "", gra: "" }, feedback: "", bandScore: "" },
                    task2: parsed.task2 || { criteria: { tr: "", cc: "", lr: "", gra: "" }, feedback: "", bandScore: "" }
                });
            } else {
                setReviewData({
                    score: selectedSubmission.score?.toString() || "",
                    bandScore: selectedSubmission.bandScore || "",
                    feedback: parsed.comments || selectedSubmission.feedback || "",
                    comments: parsed.comments || selectedSubmission.feedback || "",
                    task1: { criteria: { ta: "", cc: "", lr: "", gra: "" }, feedback: "", bandScore: "" },
                    task2: { criteria: { tr: "", cc: "", lr: "", gra: "" }, feedback: "", bandScore: "" }
                });
            }
        } else {
            setReviewData({ 
                score: "", 
                bandScore: "", 
                feedback: "",
                task1: { criteria: { ta: "", cc: "", lr: "", gra: "" }, feedback: "", bandScore: "" },
                task2: { criteria: { tr: "", cc: "", lr: "", gra: "" }, feedback: "", bandScore: "" },
                comments: ""
            });
        }
    }, [selectedSubmission]);

    const { 
        data: submissions = [], 
        refetch: fetchSubmissions 
    } = useQuery({
        queryKey: ["skill-submissions", filter.status, filter.testType],
        queryFn: async () => {
            const { data } = await axiosSecure.get(`/submissions?status=${filter.status}&testType=${filter.testType}`);
            return data.submissions ?? [];
        },
        enabled: activeTab === "skill-labs"
    });

    useEffect(() => {
        if (location.state?.submissionId) {
            setActiveTab("skill-labs");
        }
    }, [location.state?.submissionId]);

    useEffect(() => {
        if (location.state?.submissionId && submissions.length > 0) {
            const found = submissions.find(sub => sub._id === location.state.submissionId);
            if (found) {
                setSelectedSubmission(found);
                navigate(location.pathname, { replace: true, state: {} });
            }
        }
    }, [location.state?.submissionId, submissions, navigate, location.pathname]);

    const handleReviewSubmit = async (e) => {
        e.preventDefault();
        try {
            setSubmitting(true);
            let payload = { ...reviewData };
            
            if (selectedSubmission.testType === 'writing') {
                const t1c = reviewData.task1.criteria || {};
                const t2c = reviewData.task2.criteria || {};
                const t1List = [t1c.ta, t1c.cc, t1c.lr, t1c.gra];
                const t2List = [t2c.tr, t2c.cc, t2c.lr, t2c.gra];
                
                if (t1List.some(s => s === "") || t2List.some(s => s === "")) {
                    setSubmitting(false);
                    return toast.error("Please select all criteria for both Task 1 and Task 2");
                }
                
                const t1Band = calculateIeltsBand(t1List);
                const t2Band = calculateIeltsBand(t2List);
                const overallBand = calculateIeltsBand([t1Band, t2Band, t2Band]);
                const scorePct = Math.round((overallBand / 9.0) * 100);
                
                payload = {
                    score: scorePct,
                    bandScore: overallBand.toFixed(1),
                    feedback: JSON.stringify({
                        task1: {
                            criteria: t1c,
                            feedback: reviewData.task1.feedback,
                            bandScore: t1Band.toFixed(1)
                        },
                        task2: {
                            criteria: t2c,
                            feedback: reviewData.task2.feedback,
                            bandScore: t2Band.toFixed(1)
                        },
                        comments: reviewData.comments,
                        overallBand: overallBand.toFixed(1)
                    })
                };
            }
            
            const { data } = await axiosSecure.patch(`/submissions/review/${selectedSubmission._id}`, payload);
            if (data.success) {
                toast.success("Review submitted successfully!");
                setSelectedSubmission(null);
                fetchSubmissions();
            }
        } catch (error) {
            toast.error("Evaluation failed");
        } finally {
            setSubmitting(false);
        }
    };

    return {
        activeTab,
        setActiveTab,
        scores,
        setScores,
        expandedMockResult,
        setExpandedMockResult,
        mockEvalDetail,
        setMockEvalDetail,
        mockReviewData,
        setMockReviewData,
        loadingEvalDetail,
        isEditingMockGrade,
        setIsEditingMockGrade,
        results,
        loadingMock,
        handleOpenMockEval,
        handleMockReviewSubmit,
        handleGradeSubmit,
        selectedSubmission,
        setSelectedSubmission,
        reviewData,
        setReviewData,
        submitting,
        filter,
        setFilter,
        submissions,
        handleReviewSubmit
    };
};

export default useGradeSubmissions;
