import axios, { AxiosError, AxiosStatic } from 'axios';
import InternalError from '@src/util/errors/internal-error';
import config, { IConfig } from 'config';

//interfaces to create and normalize stormglass response
export interface StormGlassPointSource {
  [key: string]: number;
}

export interface StormGlassPoint {
  time: string;
  readonly waveHeight: StormGlassPointSource;
  readonly waveDirection: StormGlassPointSource;
  readonly swellDirection: StormGlassPointSource;
  readonly swellHeight: StormGlassPointSource;
  readonly swellPeriod: StormGlassPointSource;
  readonly windDirection: StormGlassPointSource;
  readonly windSpeed: StormGlassPointSource;
}

export interface StormGlassForecastResponse {
  hours: StormGlassPoint[];
}

export interface ForecastPoint {
  swellDirection: number;
  swellHeight: number;
  swellPeriod: number;
  time: string;
  waveDirection: number;
  waveHeight: number;
  windDirection: number;
  windSpeed: number;
}

export class StormGlassUnexpectedServerError extends InternalError {
  constructor(message: string) {
    super(message);
  }
}

export class ClientRequestError extends InternalError {
  constructor(message: string) {
    const internalMessage =
      'Unexpected error when trying to communicate with Storm Glass';
    super(`${internalMessage}: ${message}`);
  }
}
export class StormGlassResponseError extends InternalError {
  constructor(message: string) {
    const internalMessage = 'Unexpected error returned by Storm Glass service';
    super(`${internalMessage}: ${message}`);
  }
}

const stormGlassConfig: IConfig = config.get('App.resources.StormGlass');

export class StormGlass {
  readonly stormGlassAPIParams =
    'swellDirection,swellHeight,swellPeriod,waveDirection,waveHeight,windDirection,windSpeed';

  readonly stormGlassAPISource = 'noaa';

  constructor(protected request: AxiosStatic = axios) {}

  public async fetchPoints(lat: number, lon: number): Promise<ForecastPoint[]> {
    try {
      const response = await this.request.get<StormGlassForecastResponse>(
        `${stormGlassConfig.get(
          'apiUrl'
        )}/weather/point?lat=${lat}&lng=${lon}&params=${
          this.stormGlassAPIParams
        }&source=${this.stormGlassAPISource}`,
        {
          headers: {
            Authorization: stormGlassConfig.get('apiToken'),
          },
        }
      );

      return this.normalizeResponse(response.data);
    } catch (err) {
      const axiosError = err as AxiosError;

      if (
        axiosError instanceof Error &&
        axiosError.response &&
        axiosError.response.status
      ) {
        throw new StormGlassResponseError(
          `Error: ${JSON.stringify(axiosError.response.data)} Code: ${
            axiosError.response.status
          }`
        );
      }

      // The type is temporary given we will rework it in the upcoming chapters
      throw new ClientRequestError(axiosError.message);
    }
  }

  private normalizeResponse(
    points: StormGlassForecastResponse
  ): ForecastPoint[] {
    return points.hours.filter(this.isValidPoint.bind(this)).map((point) => ({
      swellDirection: point.swellDirection[this.stormGlassAPISource],
      swellHeight: point.swellHeight[this.stormGlassAPISource],
      swellPeriod: point.swellPeriod[this.stormGlassAPISource],
      time: point.time,
      waveDirection: point.waveDirection[this.stormGlassAPISource],
      waveHeight: point.waveHeight[this.stormGlassAPISource],
      windDirection: point.windDirection[this.stormGlassAPISource],
      windSpeed: point.windSpeed[this.stormGlassAPISource],
    }));
  }

  private isValidPoint(point: Partial<StormGlassPoint>): boolean {
    return !!(
      point.time &&
      point.swellDirection?.[this.stormGlassAPISource] &&
      point.swellHeight?.[this.stormGlassAPISource] &&
      point.swellPeriod?.[this.stormGlassAPISource] &&
      point.waveDirection?.[this.stormGlassAPISource] &&
      point.waveHeight?.[this.stormGlassAPISource] &&
      point.windDirection?.[this.stormGlassAPISource] &&
      point.windSpeed?.[this.stormGlassAPISource]
    );
  }
}
