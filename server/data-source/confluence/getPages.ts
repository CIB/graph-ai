import axios from 'axios';

const ATLASSIAN_API_TOKEN = process.env.ATLASSIAN_API_TOKEN;
const ATLASSIAN_API_USERNAME = process.env.ATLASSIAN_API_USERNAME;

export interface PageVersion {
  number: number;
  message: string;
  minorEdit: boolean;
  authorId: string;
  createdAt: string;
}

export interface PageBodyStorage {
  value: string;
  representation: string;
}

export interface PageBody {
  storage: PageBodyStorage;
}

export interface PageLinks {
  editui: string;
  webui: string;
  tinyui: string;
}

export interface Page {
  parentType: null | string;
  createdAt: string;
  authorId: null | string;
  id: string;
  version: PageVersion;
  position: null | number;
  title: string;
  status: string;
  ownerId: null | string;
  body: PageBody;
  parentId: null | string;
  spaceId: string;
  lastOwnerId: null | string;
  _links: PageLinks;
}

export interface PagesApiResponse {
  results: Page[];
  _links: {
    next: string;
  };
}

export async function getPages(): Promise<Page[]> {
  const url = `https://horsemedia.atlassian.net/wiki/api/v2/pages`;

  const auth = {
    username: ATLASSIAN_API_USERNAME!,
    password: ATLASSIAN_API_TOKEN!,
  };

  let cursor: string | undefined = undefined; // Add a cursor variable to keep track of pagination

  try {
    let results: Page[] = []; // Create an empty array to store all the results

    do {
      const response = await axios.get<PagesApiResponse>(url, {
        params: {
          'body-format': 'storage',
          limit: 1,
          'space-id': 450134018,
          cursor, // Pass the cursor value in the params
        },
        auth,
      });

      console.log(`Response: ${response.status} ${response.statusText}`);

      const responseData: any = response.data;
      console.log('data', responseData);
      results = results.concat(responseData.results); // Append the new results to the existing array

      const nextLink = responseData._links.next;
      if (nextLink) {
        const urlParams = new URLSearchParams(nextLink.split('?')[1]);
        cursor = urlParams.get('cursor') || undefined;
      } else {
        cursor = undefined;
      }
    } while (cursor); // Continue fetching as long as there is a next link

    return results;
  } catch (error) {
    console.error('Error fetching pages:', error);
    throw error;
  }
}
