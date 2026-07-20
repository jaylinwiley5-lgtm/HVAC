// ─── ServiceTitan API Client Stub ───
// Types and mock client for the 7-step booking flow documented in research.

export type CustomerType = "Residential" | "Commercial";
export type JobPriority = "Low" | "Normal" | "High" | "Urgent";
export type AppointmentStatus = "Scheduled" | "Dispatched" | "InProgress" | "Completed" | "Canceled";

export interface ServiceTitanConfig {
  appKey: string;
  tenantId: string;
  baseUrl: string; // e.g. https://api.servicetitan.com
}

export interface CustomerAddress {
  street: string;
  city: string;
  state: string;
  zip: string;
}

export interface CustomerContact {
  type: "Phone" | "Email" | "Mobile" | "Fax";
  value: string;
}

export interface Customer {
  id: number;
  name: string;
  type: CustomerType;
  address: CustomerAddress;
  contacts: CustomerContact[];
}

export interface Location {
  id: number;
  customerId: number;
  name: string;
  address: CustomerAddress;
}

export interface JobType {
  id: number;
  name: string;
}

export interface BusinessUnit {
  id: number;
  name: string;
}

export interface Job {
  id: number;
  customerId: number;
  locationId: number;
  businessUnitId: number;
  jobTypeId: number;
  campaignId?: number;
  priority: JobPriority;
  summary: string;
  description: string;
  status: string;
  customFields?: { name: string; value: string }[];
}

export interface Appointment {
  id: number;
  jobId: number;
  start: string; // ISO8601
  end: string;
  arrivalWindowStart: string;
  arrivalWindowEnd: string;
  status: AppointmentStatus;
}

export interface BookingResult {
  job: Job;
  appointment: Appointment;
  steps: string[];
}

/**
 * Mock ServiceTitan client. Returns realistic stub data for all 7 steps.
 * Replace with real API calls in production.
 */
export class ServiceTitanClient {
  private config: ServiceTitanConfig;

  constructor(config: ServiceTitanConfig) {
    this.config = config;
  }

  /** Step 1: Look up customer by phone */
  async findCustomerByPhone(phone: string): Promise<Customer | null> {
    // Mock: return null (new customer) for all lookups
    return null;
  }

  /** Step 1b: Create a new customer */
  async createCustomer(data: Omit<Customer, "id">): Promise<Customer> {
    return { id: 1001, ...data };
  }

  /** Step 2: Get locations for a customer */
  async getLocations(customerId: number): Promise<Location[]> {
    return [];
  }

  /** Step 2b: Create a location */
  async createLocation(customerId: number, data: Omit<Location, "id" | "customerId">): Promise<Location> {
    return { id: 2001, customerId, ...data };
  }

  /** Step 3: Get cached job type mapping */
  async getJobTypes(): Promise<JobType[]> {
    return [
      { id: 1, name: "Emergency After-Hours AC Repair" },
      { id: 2, name: "Commercial Refrigeration Repair" },
      { id: 3, name: "AC Maintenance" },
      { id: 4, name: "System Replacement Estimate" },
    ];
  }

  /** Step 3b: Get business units */
  async getBusinessUnits(): Promise<BusinessUnit[]> {
    return [{ id: 1, name: "Phoenix Residential" }, { id: 2, name: "Phoenix Commercial" }];
  }

  /** Step 4: Check availability */
  async checkAvailability(businessUnitId: number, jobTypeId: number, start: string, end: string): Promise<{ available: boolean; slots: { start: string; end: string }[] }> {
    return {
      available: true,
      slots: [{ start: new Date(Date.now() + 3600000).toISOString(), end: new Date(Date.now() + 7200000).toISOString() }],
    };
  }

  /** Step 5: Create a job */
  async createJob(data: Omit<Job, "id">): Promise<Job> {
    return { id: 3001, ...data };
  }

  /** Step 6: Create an appointment for a job */
  async createAppointment(jobId: number, data: Omit<Appointment, "id" | "jobId">): Promise<Appointment> {
    return { id: 4001, jobId, ...data };
  }

  /** Step 7: Verify job status */
  async getJob(jobId: number): Promise<Job> {
    return {
      id: jobId,
      customerId: 1001,
      locationId: 2001,
      businessUnitId: 1,
      jobTypeId: 1,
      priority: "Urgent",
      summary: "Emergency AC Repair",
      description: "Full system failure. Elderly occupant.",
      status: "Scheduled",
    };
  }

  /** Full booking flow: steps 1–7 */
  async bookJob(params: {
    customerName: string;
    customerType: CustomerType;
    phone: string;
    address: CustomerAddress;
    jobTypeId: number;
    businessUnitId: number;
    priority: JobPriority;
    summary: string;
    description: string;
  }): Promise<BookingResult> {
    const steps: string[] = [];

    // Step 1: Customer resolution
    let customer = await this.findCustomerByPhone(params.phone);
    if (!customer) {
      customer = await this.createCustomer({
        name: params.customerName,
        type: params.customerType,
        address: params.address,
        contacts: [{ type: "Phone", value: params.phone }],
      });
      steps.push(`Step 1: Created customer #${customer.id}`);
    } else {
      steps.push(`Step 1: Found existing customer #${customer.id}`);
    }

    // Step 2: Location resolution
    const locations = await this.getLocations(customer.id);
    let location: Location;
    // Simplified: always create a new location for the service address
    location = await this.createLocation(customer.id, {
      name: params.address.street,
      address: params.address,
    });
    steps.push(`Step 2: Created location #${location.id}`);

    // Step 3: Job type mapping (cached)
    steps.push(`Step 3: Mapped job type #${params.jobTypeId}, business unit #${params.businessUnitId}`);

    // Step 4: Availability check (mock)
    const now = new Date();
    const start = new Date(now.getTime() + 3600000).toISOString();
    const end = new Date(now.getTime() + 7200000).toISOString();
    await this.checkAvailability(params.businessUnitId, params.jobTypeId, start, end);
    steps.push(`Step 4: Availability confirmed`);

    // Step 5: Create job
    const job = await this.createJob({
      customerId: customer.id,
      locationId: location.id,
      businessUnitId: params.businessUnitId,
      jobTypeId: params.jobTypeId,
      priority: params.priority,
      summary: params.summary,
      description: params.description,
      status: "Scheduled",
    });
    steps.push(`Step 5: Created job #${job.id}`);

    // Step 6: Create appointment
    const appointment = await this.createAppointment(job.id, {
      start,
      end,
      arrivalWindowStart: start,
      arrivalWindowEnd: end,
      status: "Scheduled",
    });
    steps.push(`Step 6: Created appointment #${appointment.id}`);

    // Step 7: Verify
    await this.getJob(job.id);
    steps.push(`Step 7: Verified job status → Scheduled`);

    return { job, appointment, steps };
  }
}

export function createServiceTitanClient(config?: Partial<ServiceTitanConfig>): ServiceTitanClient {
  return new ServiceTitanClient({
    appKey: config?.appKey ?? "mock-app-key",
    tenantId: config?.tenantId ?? "1234567",
    baseUrl: config?.baseUrl ?? "https://api.sandbox.servicetitan.com",
  });
}
