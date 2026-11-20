
import { useCallback, useEffect, useState } from 'react';

import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  Divider,
  Grid,
  Paper,
  Stack,
  Typography,
} from '@mui/material';

import {
  CalendarMonthRounded as CalendarMonthRoundedIcon,
  CloseRounded as CloseRoundedIcon,
  DownloadRounded as DownloadRoundedIcon,
  EmojiEventsRounded as EmojiEventsRoundedIcon,
  PrintRounded as PrintRoundedIcon,
  RefreshRounded as RefreshRoundedIcon,
  SchoolRounded as SchoolRoundedIcon,
  VisibilityRounded as VisibilityRoundedIcon,
  WorkspacePremiumRounded as WorkspacePremiumRoundedIcon,
} from '@mui/icons-material';

import {
  getMyCertificates,
  type Certificate,
} from '../api/certificateApi';

import { getApiErrorMessage } from '../services/api';

export default function StudentCertificatesPage() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCertificate, setSelectedCertificate] =
    useState<Certificate | null>(null);

  const loadCertificates = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await getMyCertificates();

      setCertificates(
        Array.isArray(response.certificates)
          ? response.certificates
          : [],
      );
    } catch (err: unknown) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCertificates();
  }, [loadCertificates]);

  const formatDate = (date: string) => {
    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return 'Date unavailable';
    }

    return parsedDate.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  // Escape values before inserting them into the printable document.
  const escapeHtml = (value: string) =>
    value.replace(/[&<>"']/g, (character) => {
      const entities: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      };

      return entities[character];
    });

  const handlePrint = (certificate: Certificate) => {
    const printWindow = window.open(
      '',
      '_blank',
      'width=1100,height=800',
    );

    if (!printWindow) {
      setError(
        'Please allow pop-ups in your browser to download or print the certificate.',
      );
      return;
    }

    const studentName = escapeHtml(
      certificate.student?.name || 'Student',
    );

    const courseName = escapeHtml(
      certificate.course?.title || 'Completed Course',
    );

    const instructor = escapeHtml(
      certificate.course?.instructor || 'LearnLoop AI',
    );

    const certificateNumber = escapeHtml(
      certificate.certificateNumber,
    );

    const issueDate = escapeHtml(
      formatDate(certificate.issuedAt),
    );

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Certificate - ${certificateNumber}</title>
          <meta charset="UTF-8" />

          <style>
            * {
              box-sizing: border-box;
            }

            body {
              margin: 0;
              padding: 24px;
              font-family: Georgia, 'Times New Roman', serif;
              background: #ffffff;
              color: #25204c;
            }

            .certificate {
              width: 100%;
              min-height: 650px;
              border: 12px solid #F26A21;
              padding: 12px;
              text-align: center;
            }

            .inner {
              min-height: 600px;
              border: 2px solid #c9ad61;
              padding: 55px 35px;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
            }

            .brand {
              color: #F26A21;
              font-family: Arial, sans-serif;
              font-size: 19px;
              font-weight: bold;
              letter-spacing: 5px;
            }

            .award {
              margin: 28px 0 8px;
              color: #b08a35;
              font-size: 42px;
            }

            .subtitle {
              color: #F26A21;
              font-family: Arial, sans-serif;
              font-size: 14px;
              letter-spacing: 5px;
              text-transform: uppercase;
            }

            .student {
              margin: 28px 0 15px;
              font-size: 40px;
              font-weight: bold;
              color: #28204e;
            }

            .description {
              max-width: 700px;
              font-size: 18px;
              line-height: 1.8;
              color: #555;
            }

            .course {
              margin: 15px 0;
              font-size: 30px;
              font-weight: bold;
              color: #F26A21;
            }

            .footer {
              width: 100%;
              margin-top: 65px;
              display: flex;
              justify-content: space-between;
              gap: 20px;
              font-family: Arial, sans-serif;
              font-size: 13px;
              color: #555;
            }

            .footer div {
              flex: 1;
              border-top: 1px solid #b08a35;
              padding-top: 12px;
            }

            .number {
              margin-top: 35px;
              font-family: Arial, sans-serif;
              font-size: 12px;
              color: #777;
            }

            @page {
              size: landscape;
              margin: 10mm;
            }

            @media print {
              body {
                padding: 0;
              }

              .certificate {
                min-height: 175mm;
                height: 175mm;
              }

              .inner {
                min-height: 150mm;
              }
            }
          </style>
        </head>

        <body>
          <div class="certificate">
            <div class="inner">

              <div class="brand">LEARNLOOP AI</div>

              <div class="award">Certificate of Achievement</div>

              <div class="subtitle">
                Certificate of Completion
              </div>

              <p class="description">
                This certificate is proudly presented to
              </p>

              <div class="student">${studentName}</div>

              <p class="description">
                For successfully completing the course
              </p>

              <div class="course">${courseName}</div>

              <p class="description">
                demonstrating commitment, dedication,
                and successful completion of the learning requirements.
              </p>

              <div class="footer">
                <div>
                  <strong>${issueDate}</strong><br />
                  Date of Issue
                </div>

                <div>
                  <strong>${instructor}</strong><br />
                  Course Instructor
                </div>

                <div>
                  <strong>LearnLoop AI</strong><br />
                  Learning Platform
                </div>
              </div>

              <div class="number">
                Certificate Number: ${certificateNumber}
              </div>

            </div>
          </div>

          <script>
            window.onload = function () {
              window.print();
            };
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();
  };

  return (
    <Box>
      {/* Page heading */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 800 }}>
          My Certificates
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mt: 0.8 }}
        >
          Celebrate your learning achievements and access your
          course completion certificates.
        </Typography>
      </Box>

      {/* Statistics */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Avatar
                sx={{
                  bgcolor: '#FFF1E8',
                  color: '#F26A21',
                  mb: 1.5,
                }}
              >
                <WorkspacePremiumRoundedIcon />
              </Avatar>

              <Typography color="text.secondary" variant="body2">
                Certificates Earned
              </Typography>

              <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5 }}>
                {loading ? '—' : certificates.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Avatar
                sx={{
                  bgcolor: '#E2F6ED',
                  color: '#218B72',
                  mb: 1.5,
                }}
              >
                <EmojiEventsRoundedIcon />
              </Avatar>

              <Typography color="text.secondary" variant="body2">
                Learning Achievements
              </Typography>

              <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5 }}>
                {loading ? '—' : certificates.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Certificate list heading */}
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 2 }}
      >
        <Typography variant="h6" sx={{ fontWeight: 800 }}>
          Your Achievements
        </Typography>

        <Button
          size="small"
          startIcon={<RefreshRoundedIcon />}
          onClick={() => void loadCertificates()}
          disabled={loading}
        >
          Refresh
        </Button>
      </Stack>

      {/* Error */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Loading */}
      {loading ? (
        <Box
          sx={{
            minHeight: 220,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <CircularProgress />
        </Box>
      ) : certificates.length === 0 ? (
        /* Empty state */
        <Paper
          variant="outlined"
          sx={{
            py: 7,
            px: 3,
            textAlign: 'center',
            borderRadius: 3,
            borderColor: '#ECE8E4',
          }}
        >
          <Avatar
            sx={{
              width: 70,
              height: 70,
              mx: 'auto',
              mb: 2,
              bgcolor: '#FFF1E8',
              color: '#F26A21',
            }}
          >
            <WorkspacePremiumRoundedIcon sx={{ fontSize: 38 }} />
          </Avatar>

          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            No certificates yet
          </Typography>

          <Typography
            color="text.secondary"
            sx={{ mt: 1, maxWidth: 420, mx: 'auto' }}
          >
            Complete all lessons and pass every published quiz
            in your enrolled courses to earn your first certificate.
          </Typography>
        </Paper>
      ) : (
        /* Certificate cards */
        <Grid container spacing={2}>
          {certificates.map((certificate) => (
            <Grid item xs={12} md={6} key={certificate.id}>
              <Card
                sx={{
                  height: '100%',
                  borderRadius: 3,
                  transition: 'transform 180ms ease',
                  '&:hover': {
                    transform: 'translateY(-3px)',
                    boxShadow: '0 10px 28px rgba(60,30,10,0.08)',
                  },
                }}
              >
                <Box
                  sx={{
                    height: 8,
                    background:
                      'linear-gradient(90deg, #F26A21, #FFB347)',
                  }}
                />

                <CardContent sx={{ p: 2.5 }}>
                  <Stack
                    direction="row"
                    spacing={2}
                    alignItems="flex-start"
                  >
                    <Avatar
                      variant="rounded"
                      sx={{
                        width: 52,
                        height: 52,
                        bgcolor: '#FFF1E8',
                        color: '#F26A21',
                        borderRadius: 2.5,
                      }}
                    >
                      <WorkspacePremiumRoundedIcon sx={{ fontSize: 30 }} />
                    </Avatar>

                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        variant="subtitle1"
                        sx={{ fontWeight: 800, overflowWrap: 'anywhere' }}
                      >
                        {certificate.course?.title || 'Completed Course'}
                      </Typography>

                      <Chip
                        label="Certificate Earned"
                        color="success"
                        size="small"
                        sx={{ mt: 1, fontWeight: 700 }}
                      />
                    </Box>
                  </Stack>

                  <Box sx={{ mt: 2.5 }}>
                    <Stack
                      direction="row"
                      spacing={1}
                      alignItems="center"
                      sx={{ mb: 1.5 }}
                    >
                      <SchoolRoundedIcon
                        fontSize="small"
                        color="action"
                      />

                      <Typography variant="body2" color="text.secondary">
                        {certificate.course?.instructor
                          ? `Instructor: ${certificate.course.instructor}`
                          : 'Course completion certificate'}
                      </Typography>
                    </Stack>

                    <Stack
                      direction="row"
                      spacing={1}
                      alignItems="center"
                      sx={{ mb: 1.5 }}
                    >
                      <CalendarMonthRoundedIcon
                        fontSize="small"
                        color="action"
                      />

                      <Typography variant="body2" color="text.secondary">
                        Issued on: {formatDate(certificate.issuedAt)}
                      </Typography>
                    </Stack>

                    <Paper
                      variant="outlined"
                      sx={{
                        p: 1.5,
                        bgcolor: '#FFF8F3',
                        borderRadius: 2,
                      }}
                    >
                      <Typography variant="caption" color="text.secondary">
                        Certificate Number
                      </Typography>

                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 800,
                          color: '#D9561A',
                          overflowWrap: 'anywhere',
                        }}
                      >
                        {certificate.certificateNumber}
                      </Typography>
                    </Paper>

                    <Stack
                      direction={{ xs: 'column', sm: 'row' }}
                      spacing={1}
                      sx={{ mt: 2 }}
                    >
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<VisibilityRoundedIcon />}
                        onClick={() =>
                          setSelectedCertificate(certificate)
                        }
                      >
                        View Certificate
                      </Button>

                      <Button
                        fullWidth
                        variant="contained"
                        startIcon={<DownloadRoundedIcon />}
                        onClick={() => handlePrint(certificate)}
                        sx={{
                          bgcolor: '#F26A21',
                          '&:hover': { bgcolor: '#D9561A' },
                        }}
                      >
                        Download PDF
                      </Button>
                    </Stack>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Certificate preview dialog */}
      <Dialog
        open={Boolean(selectedCertificate)}
        onClose={() => setSelectedCertificate(null)}
        fullWidth
        maxWidth="lg"
      >
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{ px: 3, pt: 2 }}
        >
          <Typography variant="h6" fontWeight={800}>
            Certificate Preview
          </Typography>

          <Button
            color="inherit"
            onClick={() => setSelectedCertificate(null)}
            startIcon={<CloseRoundedIcon />}
          >
            Close
          </Button>
        </Stack>

        <DialogContent sx={{ p: { xs: 2, md: 3 } }}>
          {selectedCertificate && (
            <Paper
              elevation={0}
              sx={{
                p: { xs: 2, md: 5 },
                border: '12px solid #F26A21',
                bgcolor: '#FFFEFC',
                backgroundImage:
                  'radial-gradient(circle at center, #FFFFFF 0%, #FFF8F3 100%)',
              }}
            >
              <Box
                sx={{
                  border: '2px solid #C9AD61',
                  p: { xs: 2, md: 4 },
                  textAlign: 'center',
                }}
              >
                <Typography
                  variant="overline"
                  sx={{
                    color: '#F26A21',
                    fontWeight: 900,
                    letterSpacing: { xs: 3, md: 6 },
                  }}
                >
                  LEARNLOOP AI
                </Typography>

                <WorkspacePremiumRoundedIcon
                  sx={{
                    display: 'block',
                    mx: 'auto',
                    mt: 2,
                    fontSize: { xs: 48, md: 70 },
                    color: '#B08A35',
                  }}
                />

                <Typography
                  sx={{
                    mt: 2,
                    color: '#B08A35',
                    fontFamily: 'Georgia, serif',
                    fontSize: { xs: 24, md: 40 },
                    fontWeight: 700,
                  }}
                >
                  Certificate of Achievement
                </Typography>

                <Typography
                  variant="subtitle2"
                  sx={{
                    color: '#F26A21',
                    letterSpacing: 3,
                    mt: 1,
                  }}
                >
                  CERTIFICATE OF COMPLETION
                </Typography>

                <Typography sx={{ mt: 4, color: 'text.secondary' }}>
                  This certificate is proudly presented to
                </Typography>

                <Typography
                  sx={{
                    mt: 2,
                    fontSize: { xs: 25, md: 38 },
                    fontWeight: 800,
                    fontFamily: 'Georgia, serif',
                    color: '#28204E',
                    overflowWrap: 'anywhere',
                  }}
                >
                  {selectedCertificate.student?.name || 'Student'}
                </Typography>

                <Typography sx={{ mt: 3, color: 'text.secondary' }}>
                  For successfully completing the course
                </Typography>

                <Typography
                  sx={{
                    mt: 2,
                    fontSize: { xs: 21, md: 30 },
                    fontWeight: 800,
                    color: '#F26A21',
                  }}
                >
                  {selectedCertificate.course?.title || 'Completed Course'}
                </Typography>

                <Typography
                  sx={{
                    mt: 2,
                    color: 'text.secondary',
                    lineHeight: 1.8,
                  }}
                >
                  Demonstrating commitment, dedication, and successful
                  completion of the learning requirements.
                </Typography>

                <Divider sx={{ my: 4, borderColor: '#D9C58D' }} />

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <Typography fontWeight={700}>
                      {formatDate(selectedCertificate.issuedAt)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Date of Issue
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sm={4}>
                    <Typography fontWeight={700}>
                      {selectedCertificate.course?.instructor || 'LearnLoop AI'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Course Instructor
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sm={4}>
                    <Typography fontWeight={700}>
                      LearnLoop AI
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Learning Platform
                    </Typography>
                  </Grid>
                </Grid>

                <Typography
                  variant="caption"
                  display="block"
                  sx={{ mt: 4, color: 'text.secondary', overflowWrap: 'anywhere' }}
                >
                  Certificate Number: {selectedCertificate.certificateNumber}
                </Typography>
              </Box>
            </Paper>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2.5 }}>
          <Button
            onClick={() => setSelectedCertificate(null)}
            color="inherit"
          >
            Close
          </Button>

          {selectedCertificate && (
            <Button
              variant="contained"
              startIcon={<PrintRoundedIcon />}
              onClick={() => handlePrint(selectedCertificate)}
              sx={{
                bgcolor: '#F26A21',
                '&:hover': { bgcolor: '#D9561A' },
              }}
            >
              Download / Print PDF
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}
