import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const saveTemplate = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const { name, description, icon } = req.body;
    
    // Get current shop settings
    const settings = await prisma.shopSettings.findUnique({
      where: { sellerId }
    });
    
    if (!settings) {
      return res.status(404).json({ message: "Shop settings not found" });
    }
    
    const template = await prisma.shopTemplate.create({
      data: {
        sellerId,
        shopSettingsId: settings.id,
        name,
        description,
        icon,
        bannerConfig: settings.bannerConfig,
        logoType: settings.logoType,
        logoText: settings.logoText,
        logoIcon: settings.logoIcon,
        logoTextColor: settings.logoTextColor,
        logoIconColor: settings.logoIconColor,
        logoBackgroundColor: settings.logoBackgroundColor,
        logoFont: settings.logoFont,
        logoLayout: settings.logoLayout,
        primaryColor: settings.primaryColor,
        accentColor: settings.accentColor,
        tagline: settings.tagline,
      }
    });
    
    res.json(template);
  } catch (err) {
    console.error("Save template error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getTemplates = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const templates = await prisma.shopTemplate.findMany({
      where: { sellerId },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json(templates);
  } catch (err) {
    console.error("Get templates error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const applyTemplate = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const { templateId } = req.params;
    
    const template = await prisma.shopTemplate.findFirst({
      where: { id: parseInt(templateId), sellerId }
    });
    
    if (!template) {
      return res.status(404).json({ message: "Template not found" });
    }
    
    // Update shop settings with template data
    const settings = await prisma.shopSettings.upsert({
      where: { sellerId },
      update: {
        bannerConfig: template.bannerConfig,
        logoType: template.logoType,
        logoText: template.logoText,
        logoIcon: template.logoIcon,
        logoTextColor: template.logoTextColor,
        logoIconColor: template.logoIconColor,
        logoBackgroundColor: template.logoBackgroundColor,
        logoFont: template.logoFont,
        logoLayout: template.logoLayout,
        primaryColor: template.primaryColor,
        accentColor: template.accentColor,
        tagline: template.tagline,
        // Clear uploaded files when applying template
        bannerImage: null,
        shopLogo: null,
      },
      create: {
        sellerId,
        bannerConfig: template.bannerConfig,
        logoType: template.logoType,
        logoText: template.logoText,
        logoIcon: template.logoIcon,
        logoTextColor: template.logoTextColor,
        logoIconColor: template.logoIconColor,
        logoBackgroundColor: template.logoBackgroundColor,
        logoFont: template.logoFont,
        logoLayout: template.logoLayout,
        primaryColor: template.primaryColor,
        accentColor: template.accentColor,
        tagline: template.tagline,
      }
    });
    
    res.json(settings);
  } catch (err) {
    console.error("Apply template error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getTemplate = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const { templateId } = req.params;
    
    const template = await prisma.shopTemplate.findFirst({
      where: { id: parseInt(templateId), sellerId }
    });
    
    if (!template) {
      return res.status(404).json({ message: "Template not found" });
    }
    
    res.json({
      settings: {
        bannerConfig: template.bannerConfig,
        logoType: template.logoType,
        logoText: template.logoText,
        logoIcon: template.logoIcon,
        logoTextColor: template.logoTextColor,
        logoIconColor: template.logoIconColor,
        logoBackgroundColor: template.logoBackgroundColor,
        logoFont: template.logoFont,
        logoLayout: template.logoLayout,
        primaryColor: template.primaryColor,
        accentColor: template.accentColor,
        tagline: template.tagline,
      }
    });
  } catch (err) {
    console.error("Get template error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteTemplate = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const { templateId } = req.params;
    
    await prisma.shopTemplate.deleteMany({
      where: { id: parseInt(templateId), sellerId }
    });
    
    res.json({ message: "Template deleted" });
  } catch (err) {
    console.error("Delete template error:", err);
    res.status(500).json({ message: "Server error" });
  }
};