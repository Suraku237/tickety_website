// =============================================================
// QUEUE SERVICE
// Responsibilities:
//   - Manage queue operations (backend integration)
//   - Create, read, update, delete queues
//   - Handle QR code operations
// OOP Principle: Encapsulation, Single Responsibility
// =============================================================

import * as api from './api.service';

export async function createQueue(adminId, name, description, category) {
  return api.createService({
    adminId,
    name,
    description,
    category,
  });
}

export async function getQueues() {
  return api.getAllServices();
}

export async function getQueue(queueId) {
  return api.getService(queueId);
}

export async function updateQueue(queueId, data) {
  return api.updateService(queueId, data);
}

export async function deleteQueue(queueId) {
  return api.deleteService(queueId);
}

export async function getQRCode(queueId) {
  return api.getServiceQRCode(queueId);
}

export async function regenerateQR(queueId) {
  return api.regenerateServiceQR(queueId);
}
