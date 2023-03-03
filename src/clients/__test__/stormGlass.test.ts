import { StormGlass } from '@src/clients/stormGlass';
import axios from 'axios';
import stormGlassWeatherAPIResponseFixture from '@test/fixtures/storm_glass_weather_3_hours.json';
import normalizedForecastFixture from '@test/fixtures/storm_glass_normalized_weather_3_hours.json';

jest.mock('axios');

describe('Storm glass client', () => {
  const mockedAxios = axios as jest.Mocked<typeof axios>;

  it('should return a forecast for 3 hours', async () => {
    const lat = -33.181981;
    const lon = 12.141961;

    mockedAxios.get.mockResolvedValue({
      data: stormGlassWeatherAPIResponseFixture,
    });

    const stormGlass = new StormGlass(mockedAxios);
    const result = await stormGlass.fetchPoints(lat, lon);

    expect(result).toEqual(normalizedForecastFixture);
  });

  it('should exclude incomplete data points', async () => {
    const lat = -33.792726;
    const lng = 151.289824;
    const incompleteResponse = {
      hours: [
        {
          windDirection: {
            noaa: 300,
          },
          time: '2020-04-26T00:00:00+00:00',
        },
      ],
    };
    mockedAxios.get.mockResolvedValue({ data: incompleteResponse });

    const stormGlass = new StormGlass(mockedAxios);
    const response = await stormGlass.fetchPoints(lat, lng);

    expect(response).toEqual([]);
  });

  it('should throw an unexpected error', async () => {
    const lat = -33.181981;
    const lon = 12.141961;

    mockedAxios.get.mockRejectedValue({ message: 'Network Error' });

    const stormGlass = new StormGlass(mockedAxios);

    await expect(stormGlass.fetchPoints(lat, lon)).rejects.toThrow(
      'Unexpected error when trying to communicate with Storm Glass: Network Error'
    );
  });

  it('should throw an rate limit error', async () => {
    const lat = -33.181981;
    const lon = 12.141961;

    class FakeAxiosError extends Error {
      constructor(public response: object) {
        super();
      }
    }

    mockedAxios.get.mockRejectedValue(
      new FakeAxiosError({
        status: 429,
        data: { errors: ['Rate Limit reached'] },
      })
    );

    const stormGlass = new StormGlass(mockedAxios);

    await expect(stormGlass.fetchPoints(lat, lon)).rejects.toThrow(
      'Unexpected error returned by Storm Glass service: Error: {"errors":["Rate Limit reached"]} Code: 429'
    );
  });
});
