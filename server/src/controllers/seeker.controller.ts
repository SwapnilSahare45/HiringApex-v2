import { Response } from 'express';
import { SeekerProfile } from '../models/Seeker';
import { AuthRequest } from '../types/user.types';
import {
  certificationSchema,
  educationSchema,
  experienceSchema,
  seekerProfileUpdateSchema,
} from '../validators/seeker.validator';

export const getSeekerProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    const seekerProfile = await SeekerProfile.findOne({ user: userId });
    // .populate('skills', 'name slug')
    // .populate('skills.category', 'name');

    if (!seekerProfile) {
      const newProfile = await SeekerProfile.create({ user: userId });
      res.status(200).json({ seekerProfile: newProfile });
      return;
    }

    res.status(200).json({ seekerProfile });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

const calculateProfileCompletion = (data: Record<string, any>): number => {
  const fields = [
    { key: 'headline', weight: 10 },
    { key: 'bio', weight: 10 },
    { key: 'skills', weight: 10 },
    { key: 'experience', weight: 15 },
    { key: 'education', weight: 15 },
    { key: 'certifications', weight: 5 },
    { key: 'languages', weight: 5 },
    { key: 'resume', weight: 15 },
    { key: 'location', weight: 5 },
    { key: 'socialLinks', weight: 5 },
    { key: 'preferredJobType', weight: 5 },
  ];

  let total = 0;

  for (const field of fields) {
    const value = data[field.key];

    if (!value) continue;

    if (Array.isArray(value) && value.length > 0) {
      total += field.weight;
    } else if (field.key === 'resume' && value?.url) {
      total += field.weight;
    } else if (field.key === 'location' && (value?.city || value?.country)) {
      total += field.weight;
    } else if (field.key === 'socialLinks') {
      const hasAny = Object.values(value).some((v) => v !== '');
      if (hasAny) total += field.weight;
    } else if (typeof value === 'string' && value.trim() !== '') {
      total += field.weight;
    }
  }
  return Math.min(total, 100);
};

export const updateSeekerProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    const result = seekerProfileUpdateSchema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({
        message: 'Validation failed',
        errors: result.error.issues.map((err) => ({
          field: err.path[0],
          message: err.message,
        })),
      });
      return;
    }

    // TODO: Resume upload middleware

    const {
      headline,
      bio,
      skills,
      customSkills,
      experience,
      education,
      certifications,
      languages,
      resume,
      portfolio,
      socialLinks,
      location,
      preferredJobType,
      expectedSalary,
      totalExperienceYears,
      availability,
      isProfilePublic,
    } = result.data;

    const updateData: Record<string, any> = {};

    if (headline !== undefined) updateData.headline = headline;
    if (bio !== undefined) updateData.bio = bio;
    if (skills !== undefined) updateData.skills = skills;
    if (customSkills !== undefined) updateData.customSkills = customSkills;
    if (experience !== undefined) updateData.experience = experience;
    if (education !== undefined) updateData.education = education;
    if (certifications !== undefined) updateData.certifications = certifications;
    if (languages !== undefined) updateData.languages = languages;
    if (resume !== undefined) updateData.resume = resume;
    if (portfolio !== undefined) updateData.portfolio = portfolio;
    if (socialLinks !== undefined) updateData.socialLinks = socialLinks;
    if (location !== undefined) updateData.location = location;
    if (preferredJobType !== undefined) updateData.preferredJobType = preferredJobType;
    if (expectedSalary !== undefined) updateData.expectedSalary = expectedSalary;
    if (totalExperienceYears !== undefined) updateData.totalExperienceYears = totalExperienceYears;
    if (availability !== undefined) updateData.availability = availability;
    if (isProfilePublic !== undefined) updateData.isProfilePublic = isProfilePublic;

    const existingProfile = await SeekerProfile.findOne({ user: userId });
    const mergedData = { ...existingProfile, ...updateData };
    updateData.profileCompletionPercentage = calculateProfileCompletion(mergedData);

    const updatedProfile = await SeekerProfile.findOneAndUpdate(
      { user: userId },
      { $set: updateData },
      {
        new: true, // return updated document
        upsert: true, // create profile if it doesn't exist yet
        runValidators: true,
      }
    );
    // .populate('skills', 'name slug');

    res.status(200).json({
      message: 'Profile updated successfully',
      seekerProfile: updatedProfile,
      profileCompletionPercentage: updateData.profileCompletionPercentage,
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

//  TODO: Update resume controller
//  TODO: Delete resume controller

export const addExperience = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    const result = experienceSchema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({
        message: 'Validation failed',
        errors: result.error.issues.map((err) => ({
          field: err.path[0],
          error: err.message,
        })),
      });
      return;
    }

    const { jobTitle, company, location, startDate, endDate, isCurrent, description } = result.data;

    const experience = {
      jobTitle,
      company,
      location,
      startDate,
      endDate: isCurrent ? undefined : endDate,
      isCurrent,
      description,
    };

    const updatedProfile = await SeekerProfile.findOneAndUpdate(
      { user: userId },
      { $push: { experience: experience } },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json({
      message: 'Experience added successfully',
      experience: updatedProfile?.experience,
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

export const updateExperience = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { expId } = req.params;

    const result = experienceSchema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({
        message: 'Validation failed',
        errors: result.error.issues.map((err) => ({
          field: err.path[0],
          error: err.message,
        })),
      });
      return;
    }

    const { jobTitle, company, location, startDate, endDate, isCurrent, description } = result.data;

    const updatedProfile = await SeekerProfile.findOneAndUpdate(
      { user: userId, 'experience._id': expId },
      {
        $set: {
          'experience.$.jobTitle': jobTitle,
          'experience.$.company': company,
          'experience.$.location': location,
          'experience.$.startDate': startDate,
          'experience.$.endDate': isCurrent ? undefined : endDate,
          'experience.$.isCurrent': isCurrent,
          'experience.$.description': description,
        },
      },
      { new: true, runValidators: true }
    );

    if (!updatedProfile) {
      res.status(404).json({ message: 'Experience not found' });
      return;
    }

    res.status(200).json({
      message: 'Experience updated successfully',
      experience: updatedProfile.experience,
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

export const deleteExperience = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { expId } = req.params;

    const updatedProfile = await SeekerProfile.findOneAndUpdate(
      { user: userId },
      { $pull: { experience: { _id: expId } } },
      { new: true }
    );

    if (!updatedProfile) {
      res.status(404).json({ message: 'Profile not found' });
      return;
    }

    res.status(200).json({
      message: 'Experience deleted successfully',
      experience: updatedProfile.experience,
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

export const addEducation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    const result = educationSchema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({
        message: 'Validation failed',
        errors: result.error.issues.map((err) => ({
          field: err.path[0],
          message: err.message,
        })),
      });
      return;
    }

    const { degree, institution, fieldOfStudy, startDate, endDate, isCurrent, grade } = result.data;

    const education = {
      degree,
      institution,
      fieldOfStudy,
      startDate,
      endDate: isCurrent ? undefined : endDate,
      isCurrent,
      grade,
    };

    const updatedProfile = await SeekerProfile.findOneAndUpdate(
      { user: userId },
      { $push: { education: education } },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json({
      message: 'Education added successfully',
      education: updatedProfile.education,
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

export const updateEducation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { eduId } = req.params;

    const result = educationSchema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({
        message: 'Validation failed',
        errors: result.error.issues.map((err) => ({
          field: err.path[0],
          message: err.message,
        })),
      });
      return;
    }

    const { degree, institution, fieldOfStudy, startDate, endDate, isCurrent, grade } = result.data;

    const updatedProfile = await SeekerProfile.findOneAndUpdate(
      { user: userId, 'education._id': eduId },
      {
        $set: {
          'education.$.degree': degree,
          'education.$.institution': institution,
          'education.$.fieldOfStudy': fieldOfStudy,
          'education.$.startDate': startDate,
          'education.$.endDate': endDate,
          'education.$.isCurrent': isCurrent,
          'education.$.grade': grade,
        },
      },
      { new: true, runValidators: true }
    );

    if (!updatedProfile) {
      res.status(404).json({ message: 'Education not found' });
      return;
    }

    res.status(200).json({
      message: 'Education updated successfully',
      education: updatedProfile.education,
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Interanl server error' });
    }
  }
};

export const deleteEducation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { eduId } = req.params;

    const updatedProfile = await SeekerProfile.findOneAndUpdate(
      { user: userId },
      { $pull: { education: { _id: eduId } } },
      { new: true }
    );

    if (!updatedProfile) {
      res.status(404).json({ message: 'Profile not found' });
      return;
    }

    res.status(200).json({
      message: 'Education deleted successfully',
      education: updatedProfile.education,
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

export const addCertification = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    const result = certificationSchema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({
        message: 'Validation failed',
        errors: result.error.issues.map((err) => ({
          field: err.path[0],
          error: err.message,
        })),
      });
      return;
    }

    const { name, issuingOrganization, issueDate, expiryDate, credentialUrl } = result.data;

    const certification = {
      name,
      issuingOrganization,
      issueDate,
      expiryDate,
      credentialUrl,
    };

    const updatedProfile = await SeekerProfile.findOneAndUpdate(
      { user: userId },
      { $push: { certifications: certification } },
      { new: true, upsert: true, runValidators: true }
    );

    if (!updatedProfile) {
      res.status(404).json({ message: 'Profile not found' });
      return;
    }

    res.status(200).json({
      message: 'Certification added successfully',
      certifications: updatedProfile.certifications,
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

export const updateCertification = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    const { certId } = req.params;

    const result = certificationSchema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({
        message: 'Validation failed',
        errors: result.error.issues.map((err) => ({
          field: err.path[0],
          message: err.message,
        })),
      });
      return;
    }

    const { name, issuingOrganization, issueDate, expiryDate, credentialUrl } = result.data;

    const updatedProfile = await SeekerProfile.findOneAndUpdate(
      { user: userId, 'certifications._id': certId },
      {
        $set: {
          'certifications.$.name': name,
          'certifications.$.issuingOrganization': issuingOrganization,
          'certifications.$.issueDate': issueDate,
          'certifications.$.expiryDate': expiryDate,
          'certifications.$.credentialUrl': credentialUrl,
        },
      },
      { new: true, runValidators: true }
    );

    if (!updatedProfile) {
      res.status(404).json({ message: 'Profile not found' });
    }

    res.status(200).json({
      message: 'Certification updated successfully',
      certifications: updatedProfile.certifications,
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

export const deleteCertification = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    const { certId } = req.params;

    const updatedProfile = await SeekerProfile.findOneAndUpdate(
      { user: userId },
      { $pull: { certifications: { _id: certId } } },
      { new: true }
    );

    if (!updatedProfile) {
      res.status(404).json({ message: 'Profile not found' });
      return;
    }

    res.status(200).json({
      message: 'Certification deleted successfully',
      certifications: updatedProfile.certifications,
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

// TODO: Seeker dashboard stats controller
// TODO: Seeker public profile controller
// TODO: Search seekers controller
// TODO: Download resume controller
