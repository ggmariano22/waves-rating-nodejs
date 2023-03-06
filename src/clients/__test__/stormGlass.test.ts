import { StormGlass } from '@src/clients/stormGlass';
import * as HTTPUtil from '@src/util/request';
import stormGlassWeatherAPIResponseFixture from '@test/fixtures/storm_glass_weather_3_hours.json';
import normalizedForecastFixture from '@test/fixtures/storm_glass_normalized_weather_3_hours.json';

jest.mock('@src/util/request');

describe('Storm glass client', () => {
  const mockedRequestInstance =
    new HTTPUtil.Request() as jest.Mocked<HTTPUtil.Request>;

  const mockedRequestClass = HTTPUtil.Request as jest.Mocked<
    typeof HTTPUtil.Request
  >;

  it('should return a forecast for 3 hours', async () => {
    const lat = -33.181981;
    const lon = 12.141961;

    mockedRequestInstance.get.mockResolvedValue({
      data: stormGlassWeatherAPIResponseFixture,
    } as HTTPUtil.Response);

    const stormGlass = new StormGlass(mockedRequestInstance);
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
    mockedRequestInstance.get.mockResolvedValue({
      data: incompleteResponse,
    } as HTTPUtil.Response);

    const stormGlass = new StormGlass(mockedRequestInstance);
    const response = await stormGlass.fetchPoints(lat, lng);

    expect(response).toEqual([]);
  });

  it('should throw an unexpected error', async () => {
    const lat = -33.181981;
    const lon = 12.141961;

    mockedRequestInstance.get.mockRejectedValue({ message: 'Network Error' });

    const stormGlass = new StormGlass(mockedRequestInstance);

    await expect(stormGlass.fetchPoints(lat, lon)).rejects.toThrow(
      'Unexpected error when trying to communicate with Storm Glass: Network Error'
    );
  });

  it('should throw an rate limit error', async () => {
    const lat = -33.181981;
    const lon = 12.141961;
    const mockedError = {
      status: 429,
      data: { errors: ['Rate Limit reached'] },
    };

    class FakeAxiosError extends Error {
      constructor(public response: object) {
        super();
      }
    }

    mockedRequestInstance.get.mockRejectedValue(
      new FakeAxiosError(mockedError)
    );

    mockedRequestClass.isRequestError.mockReturnValue(true);
    mockedRequestClass.extractErrorData.mockReturnValue(mockedError);

    const stormGlass = new StormGlass(mockedRequestInstance);

    await expect(stormGlass.fetchPoints(lat, lon)).rejects.toThrow(
      'Unexpected error returned by Storm Glass service: Error: {"errors":["Rate Limit reached"]} Code: 429'
    );
  });
});
