import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Share,
  ScrollView,
  Modal,
  TextInput,
  Clipboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows } from '../theme';
import { householdApi, submissionApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Household, HouseholdMember, RecipeSubmission } from '../types';

interface HouseholdSectionProps {
  onHouseholdChange?: () => void;
}

export default function HouseholdSection({ onHouseholdChange }: HouseholdSectionProps) {
  const { user, refreshUser } = useAuth();
  const [household, setHousehold] = useState<Household | null>(null);
  const [submissions, setSubmissions] = useState<RecipeSubmission[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [householdName, setHouseholdName] = useState('');
  const [joinModalVisible, setJoinModalVisible] = useState(false);
  const [inviteToken, setInviteToken] = useState('');
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [reviewSubmission, setReviewSubmission] = useState<RecipeSubmission | null>(null);
  const [reviewApproved, setReviewApproved] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const [currentInviteUrl, setCurrentInviteUrl] = useState<string>('');

  const isInHousehold = !!user?.householdId;
  const isAdmin = user?.role === 'admin';
  const hasPendingSubmissions = submissions.length > 0;

  useEffect(() => {
    if (isInHousehold) {
      loadHouseholdData();
    }
  }, [isInHousehold]);

  const loadHouseholdData = async () => {
    try {
      setLoading(true);
      const [householdData, submissionsData] = await Promise.all([
        householdApi.getHousehold(),
        isAdmin ? submissionApi.getPendingSubmissions() : Promise.resolve([]),
      ]);
      setHousehold(householdData);
      setSubmissions(submissionsData);
    } catch (error) {
      console.error('Error loading household data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateHousehold = () => {
    setHouseholdName('');
    setCreateModalVisible(true);
  };

  const handleCreateHouseholdSubmit = async () => {
    if (!householdName.trim()) {
      Alert.alert('Error', 'Please enter a household name');
      return;
    }

    try {
      // Refresh user state first to ensure we have latest household status
      await refreshUser();

      // Check again if user is already in a household after refresh
      if (user?.householdId) {
        Alert.alert('Error', 'You are already in a household. Please leave your current household first.');
        return;
      }

      setCreating(true);
      setCreateModalVisible(false);
      await householdApi.createHousehold({ name: householdName.trim() });
      await refreshUser();
      onHouseholdChange?.();
      Alert.alert('Success', 'Household created successfully!');
    } catch (error: any) {
      console.error('Error creating household:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to create household');
    } finally {
      setCreating(false);
    }
  };

  const handleJoinHousehold = () => {
    setJoinModalVisible(true);
  };

  const handleJoinHouseholdSubmit = async () => {
    if (!inviteToken.trim()) return;

    // Extract token from URL if it's a full URL
    let token = inviteToken.trim();
    if (token.includes('join/')) {
      token = token.split('join/')[1];
    }

    try {
      setJoining(true);
      await householdApi.joinHousehold({ token });
      await refreshUser();
      onHouseholdChange?.();
      Alert.alert('Success', 'Successfully joined household!');
      setJoinModalVisible(false);
      setInviteToken('');
    } catch (error: any) {
      console.error('Error joining household:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to join household');
    } finally {
      setJoining(false);
    }
  };

  const handleInviteMembers = async () => {
    try {
      setInviting(true);
      const { inviteUrl } = await householdApi.generateInvite();
      setCurrentInviteUrl(inviteUrl);
      setInviteModalVisible(true);
    } catch (error: any) {
      console.error('Error generating invite:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to generate invitation');
    } finally {
      setInviting(false);
    }
  };

  const handleShareInvite = async () => {
    try {
      await Share.share({
        message: `Join my household on Meal Mate! ${currentInviteUrl}`,
      });
      setInviteModalVisible(false);
    } catch (error: any) {
      console.error('Error sharing invite:', error);
      Alert.alert('Error', 'Failed to share invitation');
    }
  };

  const handleCopyInvite = async () => {
    try {
      await Clipboard.setString(currentInviteUrl);
      Alert.alert('Copied!', 'Invitation link copied to clipboard');
      setInviteModalVisible(false);
    } catch (error: any) {
      console.error('Error copying invite:', error);
      Alert.alert('Error', 'Failed to copy invitation link');
    }
  };

  const handleLeaveHousehold = () => {
    const message = isAdmin
      ? 'As the household admin, leaving will delete the entire household and remove all members. This cannot be undone.'
      : 'Are you sure you want to leave this household? You will lose access to shared recipes and plans.';

    Alert.alert(
      'Leave Household',
      message,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            try {
              setLeaving(true);
              if (isAdmin) {
                await householdApi.deleteHousehold();
              } else {
                await householdApi.leaveHousehold();
              }
              await refreshUser();
              onHouseholdChange?.();
              Alert.alert('Success', 'Left household successfully');
            } catch (error: any) {
              console.error('Error leaving household:', error);
              Alert.alert('Error', error.response?.data?.message || 'Failed to leave household');
            } finally {
              setLeaving(false);
            }
          },
        },
      ]
    );
  };

  const handleReviewSubmission = (submission: RecipeSubmission, approved: boolean) => {
    setReviewSubmission(submission);
    setReviewApproved(approved);
    setReviewNotes('');
    setReviewModalVisible(true);
  };

  const handleReviewSubmissionSubmit = async () => {
    if (!reviewSubmission) return;

    try {
      await submissionApi.reviewSubmission(reviewSubmission._id, {
        action: reviewApproved ? 'approve' : 'deny',
        reviewNotes: reviewNotes.trim() || undefined,
      });
      await loadHouseholdData(); // Refresh submissions
      Alert.alert('Success', `Recipe ${reviewApproved ? 'approved' : 'denied'} successfully`);
      setReviewModalVisible(false);
      setReviewSubmission(null);
      setReviewNotes('');
    } catch (error: any) {
      console.error('Error reviewing submission:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to review submission');
    }
  };

  if (loading) {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Household</Text>
        <View style={styles.card}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Household</Text>
      <View style={styles.card}>
        {!isInHousehold ? (
          // Not in household - show create/join options
          <>
            <TouchableOpacity
              style={styles.settingRow}
              onPress={creating ? undefined : handleCreateHousehold}
              disabled={creating}
            >
              <View style={[styles.settingIcon, { backgroundColor: colors.primary + '20' }]}>
                <Ionicons name="home-outline" size={20} color={colors.primary} />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>
                  {creating ? 'Creating...' : 'Create Household'}
                </Text>
                <Text style={styles.settingSubtitle}>
                  Start a new household and become the admin
                </Text>
              </View>
              {creating && <ActivityIndicator size="small" color={colors.primary} />}
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.settingRow}
              onPress={joining ? undefined : handleJoinHousehold}
              disabled={joining}
            >
              <View style={[styles.settingIcon, { backgroundColor: colors.secondary + '20' }]}>
                <Ionicons name="enter-outline" size={20} color={colors.secondary} />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>
                  {joining ? 'Joining...' : 'Join Household'}
                </Text>
                <Text style={styles.settingSubtitle}>
                  Join an existing household with an invitation
                </Text>
              </View>
              {joining && <ActivityIndicator size="small" color={colors.secondary} />}
            </TouchableOpacity>
          </>
        ) : (
          // In household - show household info and management
          <>
            {/* Household Info */}
            <View style={styles.householdInfo}>
              <View style={styles.householdHeader}>
                <View style={[styles.settingIcon, { backgroundColor: colors.primary + '20' }]}>
                  <Ionicons name="home" size={20} color={colors.primary} />
                </View>
                <View style={styles.householdDetails}>
                  <Text style={styles.householdName}>{household?.name || 'Household'}</Text>
                  <Text style={styles.householdRole}>
                    {isAdmin ? 'Admin' : 'Member'} • {household?.members.length || 0} members
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.divider} />

            {/* Members List */}
            <ScrollView style={styles.membersList} showsVerticalScrollIndicator={false}>
              {household?.members.map((member) => (
                <View key={member._id} style={styles.memberRow}>
                  <View style={styles.memberAvatar}>
                    <Text style={styles.memberAvatarText}>
                      {member.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                    </Text>
                  </View>
                  <View style={styles.memberInfo}>
                    <Text style={styles.memberName}>{member.name}</Text>
                    <Text style={styles.memberEmail}>{member.email}</Text>
                  </View>
                  <View style={styles.memberRole}>
                    <Text style={[
                      styles.roleText,
                      member.role === 'admin' && styles.adminRoleText
                    ]}>
                      {member.role}
                    </Text>
                  </View>
                </View>
              ))}
            </ScrollView>

            <View style={styles.divider} />

            {/* Admin Actions */}
            {isAdmin && (
              <>
                <TouchableOpacity
                  style={styles.settingRow}
                  onPress={inviting ? undefined : handleInviteMembers}
                  disabled={inviting}
                >
                  <View style={[styles.settingIcon, { backgroundColor: colors.secondary + '20' }]}>
                    <Ionicons name="person-add-outline" size={20} color={colors.secondary} />
                  </View>
                  <View style={styles.settingContent}>
                    <Text style={styles.settingTitle}>
                      {inviting ? 'Generating...' : 'Invite Members'}
                    </Text>
                    <Text style={styles.settingSubtitle}>
                      Share invitation link to add new members
                    </Text>
                  </View>
                  {inviting && <ActivityIndicator size="small" color={colors.secondary} />}
                </TouchableOpacity>

                {hasPendingSubmissions && (
                  <>
                    <View style={styles.divider} />
                    <View style={styles.submissionsHeader}>
                      <Text style={styles.submissionsTitle}>Pending Recipe Submissions</Text>
                      <View style={styles.submissionBadge}>
                        <Text style={styles.submissionBadgeText}>{submissions.length}</Text>
                      </View>
                    </View>
                    {submissions.map((submission) => (
                      <View key={submission._id} style={styles.submissionRow}>
                        <View style={styles.submissionContent}>
                          <Text style={styles.submissionUrl} numberOfLines={1}>
                            {submission.recipeUrl}
                          </Text>
                          <Text style={styles.submissionBy}>
                            Submitted by {submission.submittedBy.name}
                          </Text>
                        </View>
                        <View style={styles.submissionActions}>
                          <TouchableOpacity
                            style={[styles.actionButton, styles.approveButton]}
                            onPress={() => handleReviewSubmission(submission, true)}
                          >
                            <Ionicons name="checkmark" size={16} color={colors.white} />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.actionButton, styles.denyButton]}
                            onPress={() => handleReviewSubmission(submission, false)}
                          >
                            <Ionicons name="close" size={16} color={colors.white} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                  </>
                )}
              </>
            )}

            <View style={styles.divider} />

            {/* Leave Household */}
            <TouchableOpacity
              style={styles.settingRow}
              onPress={leaving ? undefined : handleLeaveHousehold}
              disabled={leaving}
            >
              <View style={[styles.settingIcon, { backgroundColor: colors.error + '20' }]}>
                <Ionicons name="exit-outline" size={20} color={colors.error} />
              </View>
              <View style={styles.settingContent}>
                <Text style={[styles.settingTitle, styles.settingTitleDestructive]}>
                  {leaving ? 'Leaving...' : (isAdmin ? 'Delete Household' : 'Leave Household')}
                </Text>
                <Text style={styles.settingSubtitle}>
                  {isAdmin
                    ? 'This will remove all members and cannot be undone'
                    : 'You will lose access to shared recipes and plans'
                  }
                </Text>
              </View>
              {leaving && <ActivityIndicator size="small" color={colors.error} />}
            </TouchableOpacity>
          </>
        )}
      </View>
      {/* Create Household Modal */}
      <Modal
        visible={createModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setCreateModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Household</Text>
              <TouchableOpacity
                onPress={() => setCreateModalVisible(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Enter a name for your new household:
            </Text>

            <TextInput
              style={styles.modalInput}
              value={householdName}
              onChangeText={setHouseholdName}
              placeholder="Household name"
              placeholderTextColor={colors.textMuted}
              autoFocus={true}
              maxLength={50}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setCreateModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.createButton, (!householdName.trim() || creating) && styles.buttonDisabled]}
                onPress={handleCreateHouseholdSubmit}
                disabled={!householdName.trim() || creating}
              >
                {creating ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <Text style={styles.createButtonText}>Create</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Join Household Modal */}
      <Modal
        visible={joinModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setJoinModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Join Household</Text>
              <TouchableOpacity
                onPress={() => setJoinModalVisible(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Enter the invitation link or token:
            </Text>

            <TextInput
              style={styles.modalInput}
              value={inviteToken}
              onChangeText={setInviteToken}
              placeholder="Invitation link or token"
              placeholderTextColor={colors.textMuted}
              autoFocus={true}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setJoinModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.createButton, (!inviteToken.trim() || joining) && styles.buttonDisabled]}
                onPress={handleJoinHouseholdSubmit}
                disabled={!inviteToken.trim() || joining}
              >
                {joining ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <Text style={styles.createButtonText}>Join</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Review Submission Modal */}
      <Modal
        visible={reviewModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setReviewModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {reviewApproved ? 'Approve Recipe' : 'Deny Recipe'}
              </Text>
              <TouchableOpacity
                onPress={() => setReviewModalVisible(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              {reviewApproved ? 'Add any notes for the member (optional):' : 'Provide a reason for denial:'}
            </Text>

            <TextInput
              style={[styles.modalInput, { height: 80, textAlignVertical: 'top' }]}
              value={reviewNotes}
              onChangeText={setReviewNotes}
              placeholder={reviewApproved ? 'Optional notes...' : 'Reason for denial...'}
              placeholderTextColor={colors.textMuted}
              multiline={true}
              numberOfLines={3}
              autoFocus={true}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setReviewModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, reviewApproved ? styles.createButton : styles.denyButton]}
                onPress={handleReviewSubmissionSubmit}
              >
                <Text style={reviewApproved ? styles.createButtonText : styles.cancelButtonText}>
                  {reviewApproved ? 'Approve' : 'Deny'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Invite Members Modal */}
      <Modal
        visible={inviteModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setInviteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Invite Members</Text>
              <TouchableOpacity
                onPress={() => setInviteModalVisible(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Share this invitation link with potential household members:
            </Text>

            <View style={styles.inviteLinkContainer}>
              <Text style={styles.inviteLink} selectable={true}>
                {currentInviteUrl}
              </Text>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setInviteModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.secondaryButton]}
                onPress={handleCopyInvite}
              >
                <Ionicons name="copy-outline" size={16} color={colors.secondary} />
                <Text style={styles.secondaryButtonText}>Copy Link</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.createButton]}
                onPress={handleShareInvite}
              >
                <Ionicons name="share-outline" size={16} color={colors.white} />
                <Text style={styles.createButtonText}>Share Link</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.sizes.small,
    fontWeight: typography.weights.semibold as any,
    color: colors.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
    marginHorizontal: spacing.lg,
  },
  card: {
    backgroundColor: colors.white,
    marginHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    ...shadows.card,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.medium as any,
    color: colors.text,
  },
  settingTitleDestructive: {
    color: colors.error,
  },
  settingSubtitle: {
    fontSize: typography.sizes.small,
    color: colors.textLight,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
    marginLeft: spacing.md + 36 + spacing.md,
  },
  householdInfo: {
    padding: spacing.md,
  },
  householdHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  householdDetails: {
    flex: 1,
  },
  householdName: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold as any,
    color: colors.text,
  },
  householdRole: {
    fontSize: typography.sizes.small,
    color: colors.textLight,
    marginTop: 2,
  },
  membersList: {
    maxHeight: 200,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  memberAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  memberAvatarText: {
    color: colors.textOnPrimary,
    fontSize: 12,
    fontWeight: typography.weights.bold as any,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.medium as any,
    color: colors.text,
  },
  memberEmail: {
    fontSize: typography.sizes.small,
    color: colors.textLight,
  },
  memberRole: {
    backgroundColor: colors.divider,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  adminRoleText: {
    color: colors.primary,
    fontWeight: typography.weights.semibold as any,
  },
  roleText: {
    fontSize: typography.sizes.small,
    color: colors.textLight,
    textTransform: 'capitalize',
  },
  submissionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  submissionsTitle: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.medium as any,
    color: colors.text,
  },
  submissionBadge: {
    backgroundColor: colors.secondary,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
  },
  submissionBadgeText: {
    color: colors.white,
    fontSize: typography.sizes.small,
    fontWeight: typography.weights.bold as any,
  },
  submissionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.background,
    marginHorizontal: spacing.sm,
    marginVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  submissionContent: {
    flex: 1,
  },
  submissionUrl: {
    fontSize: typography.sizes.small,
    color: colors.primary,
    marginBottom: 2,
  },
  submissionBy: {
    fontSize: typography.sizes.small,
    color: colors.textLight,
  },
  submissionActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  approveButton: {
    backgroundColor: colors.secondary,
  },
  denyButton: {
    backgroundColor: colors.error,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    margin: spacing.lg,
    width: '90%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: typography.sizes.h3,
    fontWeight: typography.weights.semibold as any,
    color: colors.text,
  },
  modalCloseButton: {
    padding: spacing.xs,
  },
  modalSubtitle: {
    fontSize: typography.sizes.body,
    color: colors.text,
    marginBottom: spacing.md,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: typography.sizes.body,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
  modalButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    minWidth: 80,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  cancelButtonText: {
    color: colors.text,
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.medium as any,
  },
  createButton: {
    backgroundColor: colors.primary,
  },
  createButtonText: {
    color: colors.white,
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.medium as any,
  },
  denyButton: {
    backgroundColor: colors.error,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  inviteLinkContainer: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  inviteLink: {
    fontSize: typography.sizes.small,
    color: colors.primary,
    fontFamily: 'monospace',
    lineHeight: 20,
  },
  secondaryButton: {
    backgroundColor: colors.secondary + '20',
    borderWidth: 1,
    borderColor: colors.secondary,
  },
  secondaryButtonText: {
    color: colors.secondary,
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.medium as any,
  },
});