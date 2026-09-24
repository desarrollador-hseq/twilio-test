"use server"

import { prisma } from "@/lib/prisma"

function countByStatus(rows: { status: string; _count: { _all: number } }[]) {
  return Object.fromEntries(rows.map((row) => [row.status, row._count._all]))
}

export async function getDashboardStats() {
  const [
    companies,
    areas,
    templates,
    employeesTotal,
    employeesActive,
    employeesInactive,
    employeesWhatsapp,
    employeesUnsubscribed,
    campaignsTotal,
    campaignsByStatus,
    messagesTotal,
    messagesByStatus,
    recentCampaigns,
    topCompanies,
  ] = await Promise.all([
    prisma.company.count({ where: { deletedAt: null } }),
    prisma.area.count({ where: { deletedAt: null, company: { deletedAt: null } } }),
    prisma.template.count({ where: { deletedAt: null } }),
    prisma.employee.count({
      where: { deletedAt: null, company: { deletedAt: null } },
    }),
    prisma.employee.count({
      where: { deletedAt: null, active: true, company: { deletedAt: null } },
    }),
    prisma.employee.count({
      where: { deletedAt: null, active: false, company: { deletedAt: null } },
    }),
    prisma.employee.count({
      where: {
        deletedAt: null,
        canSendWhatsapp: true,
        company: { deletedAt: null },
      },
    }),
    prisma.employee.count({
      where: {
        deletedAt: null,
        canSendWhatsapp: false,
        unsubscribedAt: { not: null },
        company: { deletedAt: null },
      },
    }),
    prisma.campaign.count({ where: { deletedAt: null } }),
    prisma.campaign.groupBy({
      by: ["status"],
      where: { deletedAt: null },
      _count: { _all: true },
    }),
    prisma.message.count(),
    prisma.message.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
    prisma.campaign.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        company: { select: { legalName: true } },
        _count: { select: { messages: true } },
      },
    }),
    prisma.company.findMany({
      where: { deletedAt: null },
      include: {
        _count: {
          select: {
            employees: { where: { deletedAt: null } },
            areas: { where: { deletedAt: null } },
            campaigns: { where: { deletedAt: null } },
          },
        },
      },
    }),
  ])

  const campaignStatus = countByStatus(campaignsByStatus)
  const messageStatus = countByStatus(messagesByStatus)

  const messagesDelivered =
    (messageStatus.delivered ?? 0) + (messageStatus.read ?? 0)
  const messagesFailed =
    (messageStatus.failed ?? 0) + (messageStatus.undelivered ?? 0)
  const messagesSent =
    (messageStatus.sent ?? 0) + messagesDelivered

  const topCompaniesSorted = [...topCompanies]
    .sort((a, b) => b._count.employees - a._count.employees)
    .slice(0, 5)

  return {
    companies,
    areas,
    templates,
    employees: {
      total: employeesTotal,
      active: employeesActive,
      inactive: employeesInactive,
      whatsapp: employeesWhatsapp,
      unsubscribed: employeesUnsubscribed,
    },
    campaigns: {
      total: campaignsTotal,
      draft: campaignStatus.draft ?? 0,
      sending: campaignStatus.sending ?? 0,
      completed: campaignStatus.completed ?? 0,
      failed: campaignStatus.failed ?? 0,
    },
    messages: {
      total: messagesTotal,
      queued: messageStatus.queued ?? 0,
      sent: messagesSent,
      delivered: messagesDelivered,
      failed: messagesFailed,
    },
    recentCampaigns,
    topCompanies: topCompaniesSorted,
  }
}
