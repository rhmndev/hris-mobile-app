import {httpClient} from '../https'
import type {CompanyResponse} from './types'

class CompanyService {

    async getCompany(): Promise<CompanyResponse> {
        return httpClient.get<CompanyResponse>('/company')
    }
}

export const companyService = new CompanyService()
export * from './types'